globalThis.importarModulo = async function(nomeArquivo, nomeObj = null) {
  try {
    const caminho = chrome.runtime.getURL(nomeArquivo);
    const modulo = await import(caminho);

    if (nomeObj) {
      if (!(nomeObj in modulo)) {
        console.warn(`Aviso: '${nomeObj}' não foi exportado de '${nomeArquivo}'.`);
      }
      return modulo[nomeObj];
    }
    return modulo;
  } catch(e) {
    console.error(`Falha crítica ao carregar: ${nomeArquivo}`, e);
    return null;
  }
};