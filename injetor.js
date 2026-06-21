    const interceptarHistory = (tipo) => {
      const original = history[tipo];
    
      return function() {
        const resultado = original.apply(this, arguments); // 1.0
        window.dispatchEvent(new Event('urlMudouSilenciosamente'));
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