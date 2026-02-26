const StorageManager = {
  async salvar(keyOubjeto, data = null) {
    if (!keyOubjeto) return;

    try {
      const dataTosave = typeof keyOubjeto === 'object' && keyOubjeto !== null && !Array.isArray(keyOubjeto)
          ? keyOubjeto : { [keyOubjeto]: data };

      await chrome.storage.local.set(dataTosave);
    } catch(e) { console.error("Erro no salvar:", e); }
  },

  async buscar(keys) {
    if(!keys) return null;
    try {
      const res = await chrome.storage.local.get(keys);
      return typeof keys === 'string' ? res[keys] : res;
    } catch(e) { 
      console.error("Erro no buscar:", e); 
      return null;
    }
  },

  async deletar(keys) { // 1.2
    if (!keys) return;
    try { await chrome.storage.local.remove(keys); }
    catch(e) { console.error(`Erro ao deletar ${keys}:`, e); }
  },
};




/*
  1.1 - Usamos [key] para que o JS entenda: "use o VALOR da variável key como nome da propriedade"
  1.2 - Já aceita 'idioma' OU ['idioma', 'estaCorrendo'] nativamente!
*/