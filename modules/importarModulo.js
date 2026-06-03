globalThis.importarModulo = async function(nomeArquivo, nomeObj = null) {
  try {
    const caminho = chrome.runtime.getURL(nomeArquivo);
    const modulo = await import(caminho);

    if (nomeObj) {
      if (!(nomeObj in modulo)) {
        console.warn(`Aviso: O objeto/classe '${nomeObj}' não foi exportado de dentro do arquivo '${nomeArquivo}'.`);
      }
      return modulo[nomeObj];
    }

    return modulo;
  } catch(e) {
    console.error(`Falha crítica ao carregar o módulo: ${nomeArquivo}`, e);
    return null;
  }
};