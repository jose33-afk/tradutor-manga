// UTILS - Módulo Auxiliar Global
const Ultils = {
  esperar: (ms) => new Promise(res => setTimeout(res, ms)),

  chegouAoFim: (scroller) => {
    const total = scroller.scrollHeight || document.documentElement.scrollHeight;
    const visivel = scroller === window ? window.innerHeight : scroller.clientHeight;
    const atual = scroller === window ? window.scrollY : scroller.scrollTop;
    return atual + visivel >= total - 100;
  },

  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
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
}

async function teste() {
  console.log(await EventManager.verificaSeContinua())
  
}

teste()
