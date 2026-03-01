const StorageManager = {
  variaveisGlobaisBase: {
    ultimoIdiomaOrigem: null
  },

  variaveisBase: {
    estaCorrendo: false,
    idiomaOrigem: "en",
    idiomaConfig: navigator.language.slice(0, 2) || "pt",
    ultimaUrl: null
  },

  _isTabIdValido(tabId) {
    if (tabId instanceof Promise) {
      console.error("[StorageManager] Faltou o 'await' na hora de pegar o tabId! Ele chegou como Promise.");
      return null;
    }
    if (tabId === 'global') return true;
    if (tabId === null || typeof tabId !== 'number') return null;
    return true;
  },

  _getConfig(tabId) {
    if (tabId === 'global') {
      return { nomeGaveta: 'configuracoesGlobais', base: this.variaveisGlobaisBase };
    }
    return { nomeGaveta: `aba_${tabId}`, base: this.variaveisBase };
  },

  async salvar(tabId, novosdados) {
    if (!this._isTabIdValido(tabId) || typeof novosdados !== 'object' || novosdados === null ) return; // 1.8
    
    const { nomeGaveta, base } = this._getConfig(tabId);

    try {
      const res = await chrome.storage.local.get(nomeGaveta);
      const dados = res[nomeGaveta] || { ...base };

      const dadosAtualizados = { ...dados, ...novosdados };
      await chrome.storage.local.set({ [nomeGaveta]: dadosAtualizados });

    } catch(e) { console.error("Erro no salvar:", e); }
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

export default StorageManager ;