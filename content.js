// UTILS - Módulo Auxiliar Content
const Utils = {
  config: null,

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

  async getConfigHardware() {
    const dadosHardware = await StorageManager.buscar('global', 'hardware');
    const perfil = dadosHardware?.perfil || 'NORMAL';
    
    const configHardware = {
      // Adicionamos o 'usarLotes' para você usar na sua futura refatoração(alterar depois o mandar por lotes, aquele que tinha um comentario de performance)
      ULTRA:  { scroll: 450, retry: 300, tentativas: 40, debounceWait: 200, usarLotes: false }, 
      NORMAL: { scroll: 800, retry: 500, tentativas: 30, debounceWait: 300, usarLotes: true }, 
      LOW:    { scroll: 1500, retry: 1000, tentativas: 20, debounceWait: 600, usarLotes: true } 
    };

    this.config = configHardware[perfil];
  },
}

const EventManager = {
  permissaoParaRodar: false,

  _monitorarUlr() {
    let cacheUrl = location.href;

    setInterval(async () => {
      if (location.href !== cacheUrl) {
        cacheUrl = location.href;
    
        if (EventManager.permissaoParaRodar) {
          await Utils.esperar(1500);
          //funcao de scrolling
        }
      }
    }, 1000) // 1.7
  },

  async _perguntarAoBackground() {
    try {
      const estaCorrendo = await chrome.runtime.sendMessage({ action: "VERIFICA_ESTADO_ABA" });
      return estaCorrendo === true;
    } catch(e) {
      return false;
    }
  },

  async init() {
    await Utils.getConfigHardware();
    this.permissaoParaRodar = await this._perguntarAoBackground(); // 1.5
    this.conexaoBackground();

    this._monitorarUlr();
  },

  async conexaoBackground() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'INICIAR_TRADUCAO') {
        this.permissaoParaRodar = true;
        //ScrollManager.executarDescidaPrincipal(); DESATIVADO PARA TESTES
        sendResponse(); // 1.6
      }

      if (request.action === 'PARAR_TRADUCAO') {
        this.permissaoParaRodar = false;
        sendResponse(); 
      }
    });
  },
}

const ScrollManager = {
  _chegouAoFim (scroller) {
    const total = scroller.scrollHeight || document.documentElement.scrollHeight;
    const visivel = scroller === window ? window.innerHeight : scroller.clientHeight;
    const atual = scroller === window ? window.scrollY : scroller.scrollTop;
    return atual + visivel >= total - 100;
  },

  async _encontrarElementoComRetry() { // 30 === 15s
    const { tentativas, retry } = Utils.config;
    for (let i = 0; i < tentativas; i++) {
      const alvo = this.encontrarElementoDeScroll();
      if (alvo && alvo !== window) return alvo;
      await Utils.esperar(retry);
    }
    return window;
  },

  _monitorarScroll() {

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

  async carregarPaginaManga(scroller) {

  },

  async executarDescidaPrincipal() {
    //const { gerirPopup } = await Utils.importarModulo('popDescida.js');
    //let elementoScroll = await this._encontrarElementoComRetry(); nao ta com erro e que so funiona normal se chamar pelo EventManger
    const { AvisoManager }= await Utils.importarModulo('avisoManager.js');
    
    
    // if (elementoScroll) {
    //   gerirPopup('abrir');
    //   await Utils.esperar(Utils.config.scroll); // 1.5 
      
    //   //const sucesso = await carregarPaginaManga(elementoScroll);
    // }
  },
}

EventManager.init()
ScrollManager.executarDescidaPrincipal()




/*
  1.1 - eu verifico para ter certeza.
  1.2 - nesse caso e melhor usar o tag pq a lista ja existe no DOM,
        usando o queryAll eu teria que procurar e fazer a lista,
        mas e um metodo limitado ja que so funciona com '<img>' e outras tags.
  1.3 - o segundo alvo nao e o ALVO ensi e o proximo pai. 
  1.4 - o debounce e importante ele estar assim pra nao mexer com this.
  1.5 - para atualizar caso de F5
  1.6 - confirmando o recebimento do background, senao ele reclama.
  1.7 - Ele checa a URL a cada 1 segundo (não pesa nada no navegador)
*/