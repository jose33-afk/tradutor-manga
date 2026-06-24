const interceptarHistory = (tipo) => {
  const original = history[tipo];
      
  const obterUrlLimpa = () => {
    const url = window.location.href;
    return location.hostname.includes('mangadex.org')
      ? url.replace(/\/\d+\/?$/, '')
      : url;
  }

  return function() {
    const urlAntiga = obterUrlLimpa();
    const resultado = original.apply(this, arguments); // 1.0
    const urlNova = obterUrlLimpa();

    if (urlAntiga !== urlNova) {
      window.dispatchEvent(new Event('urlMudouSilenciosamente'));
    }

    return resultado;
  }
}

if (!history._rastreado) {
  history.pushState = interceptarHistory('pushState');
  history.replaceState = interceptarHistory('replaceState');
  history._rastreado = true;
}

/*
  1.0 - para n gerar falsos positivos
*/