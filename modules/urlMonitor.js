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
    this.#cacheAssinatura = await this.#gerarAssinaturaDOM();

    if (!this.#cacheAssinatura) {
      console.error("Erro Crítico: Falha no sistema unificado de identificação (Assinatura do DOM falhou ou página está sem imagens)!");
      //chama o event managar para para resetar o pipeline.
    }


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

  async #gerarAssinaturaDOM(maxTentativas = 20, delayMs = 500) { // 20 === 10s
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const arrayImgs = Array.from(document.getElementsByTagName('img')).filter(
        img => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450
      );
    
      if (arrayImgs.length >= 3) {
        let impressao = arrayImgs.slice(0, 2)
            .map(img => {
              return img.src.replace(/^blob:/, '').split('/').pop().substring(0, 40); // 1.2
            }).join('');

        if (impressao.length > 10) return impressao;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return null;
  }
}

/*
  1.1 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
  1.2 - Pega só o que vem depois da última '/'
*/