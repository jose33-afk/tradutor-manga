// UTILS - Módulo Auxiliar Global
const Utils = {
  esperar: (ms) => new Promise(res => setTimeout(res, ms)),

  debounce: (func, delay) => { // 1.4
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  async importarModulo(nomeArquivo) {
    const caminho = chrome.runtime.getURL(nomeArquivo);
    return await import(caminho);
  },
}

const EventManager = {
  async verificaSeContinua() {
    try {
      const estaCorrendo = await chrome.runtime.sendMessage({ action: "VERIFICA_ESTADO_ABA" });
      return estaCorrendo;
    } catch(e) {
      return false;
    }
  },

  // init() {
  //   window.addEventListener('load', async () => {
  //     if (await this.verificaSeContinua())
  //   });
  // },

}

const ScrollManager = {
  _chegouAoFim (scroller) {
    const total = scroller.scrollHeight || document.documentElement.scrollHeight;
    const visivel = scroller === window ? window.innerHeight : scroller.clientHeight;
    const atual = scroller === window ? window.scrollY : scroller.scrollTop;
    return atual + visivel >= total - 100;
  },

  async _encontrarElementoComRetry(tentativas = 30) { // 30 === 15s
    for (let i = 0; i < tentativas; i++) {
      const alvo = this.encontrarElementoDeScroll()
      if (alvo && alvo !== window) return alvo;
      await Utils.esperar(500);
    }
    return window;
  },
  
  encontrarElementoDeScroll () {
    const html = document.documentElement;
    const body = document.body;

    const podeRolar = (element) => {
      const { overflowY } = window.getComputedStyle(element);
      return overflowY !== 'hidden' && overflowY !== 'clip';
    };

    if (html.scrollHeight > html.clientHeight && podeRolar(html)) return html;
    if (body.scrollHeight > body.clientHeight && podeRolar(body)) return body;

    const imagens = Array.from(document.querySelectorAll('img')).slice(0, 15) // 1.1 
          .filter((img) => img.offsetWidth > 300 && img.offsetHeight > img.offsetWidth);

    const paisTestados = new Set();

    for (const img of imagens) {
      let alvo = img.parentElement;

      while(alvo && alvo !== html && alvo !== body) { // 1.3
        if (paisTestados.has(alvo)) {
          alvo = alvo.parentElement;
          continue;
        }

        paisTestados.add(alvo);

        if (alvo.scrollHeight > alvo.clientHeight && podeRolar(alvo)) {
          if (alvo.getElementsByTagName('img').length >= 2) return alvo; // 1.2
        }
        alvo = alvo.parentElement;
      }
    };

    console.log("Nenhum container específico achado, usando Window.");
    return window;
  },

  async executarDescidaPrincipal() {
    const { gerirPopup } = await Utils.importarModulo('popDescida.js');
    
    let elementoScroll = await this._encontrarElementoComRetry();
    console.log(elementoScroll)
  },
}

async function teste() {
  ScrollManager.executarDescidaPrincipal()
  
}

teste()


//EventManager.init()

/*
  1.1 - eu verifico para ter certeza.
  1.2 - nesse caso e melhor usar o tag pq a lista ja existe no DOM,
        usando o queryAll eu teria que procurar e fazer a lista,
        mas e um metodo limitado ja que so funciona com '<img>' e outras tags.
  1.3 - o segundo alvo nao e o ALVO ensi e o proximo pai. 
  1.4 - o debounce e importante ele estar assim pra nao mexer com this.
*/