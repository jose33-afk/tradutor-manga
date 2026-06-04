export class UrlMonitor {
  #intervaloId = null;
  #cacheUrlLimpa= null;
  #cacheAssinatura = null;
  #Avisos = null;
  #carregouDOM = null;
  #verificando = false;

  constructor(avisoManager) {
    if (!avisoManager || typeof avisoManager.verificarSecontinua !== 'function') {
      throw new Error("Módulo AvisoManager inválido ou não carregado corretamente.");
    }

    this.#Avisos = avisoManager;
  }

  destroy() {
    if (this.#intervaloId) clearInterval(this.#intervaloId);

    this.#intervaloId = null;
    this.#cacheUrlLimpa= null;
    this.#cacheAssinatura = null;
    this.#Avisos = null;
    this.#carregouDOM = null;
    this.#verificando = false;
  }

  async init() {
    if (this.#intervaloId) clearInterval(this.#intervaloId);

    this.#cacheUrlLimpa = this.#limparUrl(location.href);
    console.log(this.#cacheUrlLimpa)
  }

  // Parei aqui, esta otimizando limparUlr tem
  // pequenos ajustes finos que vai melhora-la.
  #limparUrl(urlBruta) {
    try {
      if (urlBruta.includes('mangadex.org')) return urlBruta.replace(/\/\d+\/?$/, ''); // 1.1
      return urlBruta;
    } catch(e) {
      return urlBruta;
    }
  }

 
}

/*
  1.1 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
*/