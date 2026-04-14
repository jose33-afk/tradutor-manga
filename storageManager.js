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

    if (!this._isObjetoPuro(alvo) || !this._isObjetoPuro(fonte)) {
      console.error(`[StorageManager] Bloqueado: Tentativa de salvar dados inválidos`, fonte);
      return false;
    }

    const resultado = { ...alvo };

    for (const key in fonte) {
      console.log(fonte[key])

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

    // try {
    //   const res = await chrome.storage.local.get(nomeGaveta);

    //   const dados = res[nomeGaveta] || structuredClone(base);
    //   console.log('originais', dados)

    //   const dadosAtualizados = this.mesclarDados(dados, novosdados);
    //   // const dados = res[nomeGaveta] || { ...base };

    //   // const dadosAtualizados = { ...dados, ...novosdados };
    //   // await chrome.storage.local.set({ [nomeGaveta]: dadosAtualizados });

    // } catch(e) { console.error("Erro no salvar:", e); }
  },

  async buscar(tabId, keys) {
    if(!this._isTabIdValido(tabId)) return null;
    const { nomeGaveta, base } = this._getConfig(tabId);

    try {
      const res = await chrome.storage.local.get(nomeGaveta); 
      const dadosAba = res[nomeGaveta] || { ...base }; // 1.7
      if (!keys) return dadosAba;

      if (typeof keys === 'string') return dadosAba[keys] !== undefined ? dadosAba[keys] : base[keys];

      if (Array.isArray(keys)) {
        const resultado = {};
        keys.forEach(k => {
          resultado[k] = dadosAba[k] !== undefined ? dadosAba[k] : base[k];
        });

        return resultado;
      }
      return dadosAba;
    } catch(e) { 
      console.error("Erro no buscar:", e); 
      return null;
    }
  },

  async getTabId () {
    const [tabId] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabId?.id;
  },

  async destruirGaveta(tabId) {
    if (!this._isTabIdValido(tabId) || tabId === 'global') return;
    try { await chrome.storage.local.remove(`aba_${tabId}`); }
    catch (e) { console.error(`Erro ao apagar a gaveta [${tabId}]`)};
  },
}

globalThis.StorageManager = StorageManager;

/*
  1.0 - "item &&" já descarta o null e undefined automaticamente!
*/