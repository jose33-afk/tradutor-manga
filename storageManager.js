const StorageManager = {
  variaveisGlobaisBase: {
    ultimoIdiomaOrigem: null,
    hardware: { perfil: "NORMAL", ultimoTeste: 0 }
  },

  variaveisBase: {
    estaCorrendo: false,
    idiomaOrigem: "en",
    idiomaConfig: navigator.language.slice(0, 2) || "pt",
    ultimaUrl: null
  },

  _isTabIdValido(tabId) {
    if (tabId === 'global') return true;

    if (tabId instanceof Promise) {
      console.error("[StorageManager] Erro fatal: tabId chegou como Promise. Faltou o 'await'!");
      return false;
    }

    if (typeof tabId !== 'number' || !Number.isInteger(tabId) || tabId < 0) {
      console.warn(`[StorageManager] tabId inválido rejeitado:`, tabId);
      return false;
    }

    return true;
  },

  _getConfig(tabId) {
    if (tabId === 'global') {
      return { nomeGaveta: 'configuracoesGlobais', base: this.variaveisGlobaisBase };
    }
    return { nomeGaveta: `aba_${tabId}`, base: this.variaveisBase };
  },

  _isObjetoPuro: (item) => item && typeof item === 'object' && !Array.isArray(item),

  _avaliarResultadoMultiplo(resultado, chavesAusentes, totalKeys) {
    console.log(resultado, chavesAusentes, totalKeys)
  },

  async executarSeguro(metodo, ...parametros) { // 1.2
    const MAXTENTATIVAS = 3;
    let ultimoErro = "Erro desconhecido";

    if (typeof this[metodo] !== 'function') {
      throw new Error(`O método '${metodo}' não existe no StorageManager.`);
    }

    for (let tentativa = 1; tentativa <= MAXTENTATIVAS; tentativa++) {
      try {
        const resultado = await this[metodo](...parametros);

        if (resultado && resultado.sucesso) {
          return resultado;
        } else {
          throw new Error(resultado ? resultado.erro : 'Falha interna na operação.');
        }
      } catch(e) {
        ultimoErro = e.message;

        if (tentativa < MAXTENTATIVAS) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    throw new Error(`[Storage Error] Falha ao processar '${metodo}' após ${MAXTENTATIVAS} tentativas. Motivo: ${ultimoErro}`);
  },

  mesclarDados(alvo, fonte) {
    /*
      REGRAS DE MESCLAGEM (Deep Merge):
      1. OBJETOS: Mesclagem recursiva. Chaves não mencionadas no envio são PRESERVADAS.
      2. ARRAYS E PRIMITIVOS: Substituição integral. O valor novo "esmaga" o antigo.
      LOGICA DE ATUALIZAÇÃO (Exemplos):
        - Alterar valor simples: { perfil: "LOW" } ou { chave: "dado novo" }
        - Criar nova Array:      { chave: [388, 5, 6] }
        - Adicionar em Array:    { chave: [...antigos, novo] } (Somente se for alterar)
      NOTA: Se você não pretende modificar uma Array existente, simplesmente não a inclua 
      no objeto de atualização. Ela permanecerá intacta no banco. Caso deseje alterar 
      ou adicionar itens, envie a lista completa e consolidada.
    */

    const resultado = { ...alvo };

    for (const key in fonte) {
      if(this._isObjetoPuro(fonte[key]) && this._isObjetoPuro(alvo[key])) {
        resultado[key] = this.mesclarDados(alvo[key], fonte[key]);
      } else {
        resultado[key] = fonte[key];
      }   
    }

    return resultado;
  },

  async salvar(tabId, novosdados) {
    if (!this._isTabIdValido(tabId) || !this._isObjetoPuro(novosdados)) {
      return { sucesso: false, erro: `Dados inválidos: ${novosdados}`};
    }
   
    const { nomeGaveta, base } = this._getConfig(tabId);

    try {
      const res = await chrome.storage.local.get(nomeGaveta);
      const dados = res[nomeGaveta] || structuredClone(base); // 1.1

      const dadosAtualizados = this.mesclarDados(dados, novosdados);
      await chrome.storage.local.set({ [nomeGaveta]: dadosAtualizados });

      return { sucesso: true };
    } catch(e) { 
      return { sucesso: false, erro: e.message }
    }
  },

  async buscar(tabId, keys) {
    if(!this._isTabIdValido(tabId)) return { sucesso: false, erro: "TabId inválido." };
    const { nomeGaveta, base } = this._getConfig(tabId);

    console.log('ID:', tabId,'Solicitado:', keys) //testes

    try {
      const res = await chrome.storage.local.get(nomeGaveta); 
      const dadosAba = res[nomeGaveta] || structuredClone(base); // 1.7
      const _existeChave = (chave) => (chave in dadosAba) || (chave in base);
      
      if (keys === 'tudo') return { sucesso: true, dados: dadosAba };

      if (typeof keys === 'string') {
        if (!_existeChave(keys)) {
          return { sucesso: false, erro: `A chave '${keys}' não existe no sistema.` };
        }
        return { sucesso: true, dados: (keys in dadosAba) ? dadosAba[keys] : base[keys] };
      };

      if (Array.isArray(keys)) {
        const resultado = {};
        const chavesAusentes = [];

        for (const keyAtual of keys) {
          if (!_existeChave(keyAtual)) chavesAusentes.push(keyAtual);
          else resultado[keyAtual] = (keyAtual in dadosAba) ? dadosAba[keyAtual] : base[keyAtual];
        }
  
        return this._avaliarResultadoMultiplo(resultado, chavesAusentes, keys.length);
      }

      return { sucesso: false, erro: "Formato de keys não reconhecido." };
    } catch(e) { 
      return { sucesso: false, erro: e.message };
    }
  },

  async getTabId () {
    try {
      const [tabId] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabId?.id;
    } catch(e) {
      console.error("Erro no getTabId:", e);
      return null;
    }
  },

  async destruirGaveta(tabId) {
    if (!this._isTabIdValido(tabId) || tabId === 'global') {
      return { sucesso: false, erro: "TabId inválido ou tentativa de destruir banco global." };
    }

    try { 
      await chrome.storage.local.remove(`aba_${tabId}`); 
      return { sucesso: true };
    } catch (e) {
      return { sucesso: false, erro: e.message };
    };
  },
}

globalThis.StorageManager = StorageManager;

/*
  1.0 - "item &&" já descarta o null e undefined automaticamente!
  1.1 - structuredClone faz a cópia profunda para não sujar a sua base
  1.2 - StorageManager.executarSeguro('salvar', 15, { estaCorrendo: true })
        ...parametros significa: "Pegue tudo o que sobrou (o 15 e o objeto) e empacote dentro de uma Array chamada parametros".
  1.3 - O ?? (Nullish Coalescing) pega o valor da esquerda se ele não for null/undefined.
        Tenta pegar o que está na gaveta da aba. Se o que estiver lá for um dado real (mesmo que seja false ou 0), usa ele. 
        Se a gaveta estiver vazia (null ou undefined), aí sim você pega o valor padrão que está na base."
  1.4 - Mesma coisa que if (valor === null || valor === undefined)
*/