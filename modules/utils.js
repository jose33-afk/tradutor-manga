class Utils {
  static #config = null;

  static get config() {
    return this.#config;
  }

  static delay(ms) { 
    return new Promise(res => setTimeout(res, ms))
  }

  // Eu estava aqui fazendo essa funcao de espera de um determinado elemento do DOM
  // para poder fazer a funcao "encontradorContainerPai".
  
  static async awaitDomElement(funOuElment, tentativas = 30, retry = 500) {
    const name = document.createElement(funOuElment).constructor.name;
    if (name === "HTMLUnknownElement"){ 
      console.warn(`Elemento [${funOuElment}] inválido. Adicione uma tag HTML valida!`);
      return
    };

    for (let i = 0; i < tentativas; i++) {
      let alvo = null;

      if(typeof funOuElment === 'function') alvo = funOuElment();
      if (typeof funOuElment === 'string') alvo = document.querySelector(funOuElment);
        
      

      if (alvo && alvo !== window) return alvo;
      await this.esperar(retry);
    }

    console.warn(`Elemento não carregou após ${tentativas} tentativas.`);
    return window;
  }

  static async getConfigHardware() {
    if (this.#config !== null) return this.#config;

    const dadosHardware = await StorageManager.buscar('global', 'hardware');
    const perfil = dadosHardware?.perfil || 'NORMAL';
    
    const configHardware = {
      // Depois tenho que repesar se eu uso isso em algumas partes do projeto 
      // ou so se tornou codigo legado
      ULTRA:  { scroll: 250, retry: 300, tentativas: 40, debounceWait: 800, }, 
      NORMAL: { scroll: 400, retry: 500, tentativas: 30, debounceWait: 1200, }, 
      LOW:    { scroll: 750, retry: 1000, tentativas: 20, debounceWait: 1400, } 
    };

    this.#config = configHardware[perfil];
  }

  static async gerenciarStorage(metodo, dados, escopo) {
    try {
      return await chrome.runtime.sendMessage({
        action: "GERENCIAR_STORAGE_ABA",
        escopo: escopo,
        metodo: metodo,
        dados: dados
      });
    } catch (e) {
      console.warn("[UrlMonitor] Falha na comunicação de Storage:", e);
      return { sucesso: false, dados: null };
    }
  }

  static debounce(func, delay) { 
    let timeoutId;
    return (...args) => { // 1.1
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  static encontradorContainerPai(config = {}) {
    const {
      seletorBase,
      filtroAmostras,
      validador,
      qtdAmostras = 15, 
      fallback = null
    } = config || {};

    if (!seletorBase || typeof validador !== 'function') {
     console.error("'seletorBase', 'validador' (função) e 'filtroAmostras' (função) são obrigatórios.");
      return null;
    }

    const html = document.documentElement;
    const body = document.body;

    let elementosBase = Array.from(document.querySelectorAll(seletorBase));
    console.log(elementosBase)
  }
}

export const utils = new Utils();
/*
  Classes static: Uso quando são funções utilitárias que não guardam histórico
  e cujas configurações centrais são definidas uma única vez, e nao lidam com eventos.

  1.1 - o debounce e importante ele estar assim pra nao mexer com this.
      <-- Arrow function mantêm o 'this' original de quem chamou
*/