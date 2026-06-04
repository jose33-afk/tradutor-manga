export class utils {
  static #config = null;

  static get config() {
    return this.#config;
  }

  static esperar(ms) { 
    return new Promise(res => setTimeout(res, ms))
  }

  static async getConfigHardware() {
    if (this.#config !== null) return this.#config;

    const dadosHardware = await StorageManager.buscar('global', 'hardware');
    const perfil = dadosHardware?.perfil || 'NORMAL';
    
    const configHardware = {
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
}


/*
  Classes static: Uso quando são funções utilitárias que não guardam histórico
  e cujas configurações centrais são definidas uma única vez, e nao lidam com eventos.

  1.1 - o debounce e importante ele estar assim pra nao mexer com this.
      <-- Arrow function mantêm o 'this' original de quem chamou
*/