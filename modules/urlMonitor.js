export class UrlMonitor {
  #intervaloId = null;
  #cacheUrlLimpa= null;
  #cacheAssinatura = null;
  #Avisos = null;
  #carregouDOM = null;
  #verificando = false;
  #isMangaDex = false;

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
    this.#isMangaDex = false;
  }

  async init() {
    if (this.#intervaloId) clearInterval(this.#intervaloId);

    this.#isMangaDex = location.hostname.includes('mangadex.org');
    this.#cacheUrlLimpa = this.#limparUrl(location.href);
  }

  #limparUrl(urlBruta) {
    if (typeof urlBruta !== 'string') {
      console.warn("Aviso: URL inválida recebida. Esperado 'string', mas chegou:", typeof urlBruta, urlBruta);
      return urlBruta;
    };

    if (this.#isMangaDex) {
      return urlBruta.replace(/\/\d+\/?$/, ''); // 1.1
    }
    return urlBruta;
  }
}

/*
  1.1 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
*/