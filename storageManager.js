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

  async executarSeguro(metodo, ...parametros) { // 1.2
    const MAXTENTATIVAS = 3;
    let ultimoErro = "Erro desconhecido";

    if (typeof this[metodo] !== 'function') {
      throw new Error(`O método '${metodo}' não existe no StorageManager.`);
    }

    for (let tentativa = 1; tentativa <= MAXTENTATIVAS; tentativa++) {
      try {
        const resultado = await this[metodo](...parametros);

        if (resultado !== false && resultado !== null) {
          return resultado;
        } else {
          throw new Error(``);
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
      console.error(`[StorageManager] Dados inválidos.`, novosdados);
      return false;
    }
   
    const { nomeGaveta, base } = this._getConfig(tabId);

    try {
      const res = await chrome.storage.local.get(nomeGaveta);
      const dados = res[nomeGaveta] || structuredClone(base); // 1.1

      const dadosAtualizados = this.mesclarDados(dados, novosdados);
      await chrome.storage.local.set({ [nomeGaveta]: dadosAtualizados });

      return true;
    } catch(e) { 
      console.error("Erro no salvar:", e); 
      return false;
    }
  },

  async buscar(tabId, keys) {
    if(!this._isTabIdValido(tabId)) return null;
    const { nomeGaveta, base } = this._getConfig(tabId);

    console.log(tabId, keys) //testes
    try {
      const res = await chrome.storage.local.get(nomeGaveta); 
      const dadosAba = res[nomeGaveta] || structuredClone(base); // 1.7

      console.log(dadosAba)
      if (keys === 'tudo') return dadosAba;

      console.log('passou')
      console.log(dadosAba[keys] !== undefined ? dadosAba[keys] : base[keys])

      if (typeof keys === 'string') return dadosAba[keys] !== undefined ? dadosAba[keys] : base[keys];

      

      if (Array.isArray(keys)) {
        const resultado = {};
        keys.forEach(k => {
          resultado[k] = dadosAba[k] !== undefined ? dadosAba[k] : base[k];
        });

        console.log('resultado', resultado) // Nao chegou aqui
        return resultado;
      }
      return dadosAba;
    } catch(e) { 
      console.error("Erro no buscar:", e); 
      return null;
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
    if (!this._isTabIdValido(tabId) || tabId === 'global') return;
    try { 
      await chrome.storage.local.remove(`aba_${tabId}`); 
      return true;
    } catch (e) {
      console.error(`Erro ao apagar a gaveta [${tabId}]`);
      return false;
    };
  },
}

globalThis.StorageManager = StorageManager;

/*
  1.0 - "item &&" já descarta o null e undefined automaticamente!
  1.1 - structuredClone faz a cópia profunda para não sujar a sua base
  1.2 - StorageManager.executarSeguro('salvar', 15, { estaCorrendo: true })
        ...parametros significa: "Pegue tudo o que sobrou (o 15 e o objeto) e empacote dentro de uma Array chamada parametros".
*/