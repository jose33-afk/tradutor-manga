export class UrlMonitor {
  #intervaloId = null;
  #cacheUrlLimpa= null;
  #cacheAssinatura = null;
  #Avisos = null;
  #Utils = null;
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
    this.#Utils = null;
    this.#carregouDOM = null;
    this.#verificando = false;
    this.#isMangaDex = false;
  }

  async init() {
    if (this.#intervaloId) clearInterval(this.#intervaloId);

    this.#Utils = await importarModulo("modules/utils.js", "utils");

    this.#isMangaDex = location.hostname.includes('mangadex.org');
    this.#cacheUrlLimpa = this.#limparUrl(location.href);
    this.#cacheAssinatura = await this.#gerarAssinaturaDOM();

    // if (!this.#cacheAssinatura) {
    //   console.error("Erro Crítico: Falha no sistema unificado de identificação (Assinatura do DOM falhou ou página está sem imagens)!");
    //   //chama o event managar para para resetar o pipeline.
    // }

    // await this.#Utils.gerenciarStorage("salvar", { 
    //   cacheUrl: this.#cacheUrlLimpa, 
    //   cacheAssinatura: this.#cacheAssinatura 
    // }, "aba");  
    
    // this.#iniciarVigia();
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
    
      if (arrayImgs.length >= 2) {
        const impressao = arrayImgs.slice(0, 2)
          .map(img => {
            let srcBase = img.src;

            if (srcBase.length > 300) { // 1.5
              const meioSrcBase = Math.floor(srcBase.length / 2);
              
              srcBase = srcBase.substring(0, 50) +
                        srcBase.substring(meioSrcBase, meioSrcBase + 50) +
                        srcBase.slice(-50);
              
              // eu estava aqui terminando de refatorar a funcao de assinatura
              console.log(srcBase)
            }
          });
      } 
      await this.#Utils.esperar(delayMs);
    }

    return null;
  }

  #iniciarVigia() {
    this.#intervaloId = setInterval(async () => {
      if (this.#verificando) return;
      this.#verificando = true;
      
      try {
        const urlAtual = this.#limparUrl(location.href);
        const mudouUrl = urlAtual !== this.#cacheUrlLimpa;

        let mudouAssinatura = false;
        let assinaturaAtual = null;

        if (!mudouUrl) {
          assinaturaAtual = await this.#gerarAssinaturaDOM();
          mudouAssinatura = (assinaturaAtual && this.#cacheAssinatura) 
              ? (assinaturaAtual !== this.#cacheAssinatura)
              : false;
        }

        if (mudouUrl || mudouAssinatura) {
          if (mudouUrl && !assinaturaAtual) assinaturaAtual = await this.#gerarAssinaturaDOM();
          
          this.#lidarComMudanca(urlAtual, '45');
        }

        console.log('nao mudou ')

      } finally {
        this.#verificando = false; // 1.3
      }
    }, 1000);
  }

  async #lidarComMudanca(novaUrl, novaAssinatura) {
    console.log('antes', novaAssinatura)
    console.log(novaUrl)
    novaUrl ||= this.#limparUrl(location.href); // 1.4
    novaAssinatura ||= await this.#gerarAssinaturaDOM();
    console.log(novaAssinatura)
    console.log(novaUrl)
  }
}

/*
  1.1 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
  1.2 - Pega só o que vem depois da última '/'
  1.3 - Mesmo que qualquer coisa dê erro fatal dentro do 'try', o JS joga a trava pra false
        garantindo que o monitor nunca trave silenciosamente.
  1.4   if (novaUrl === null || novaUrl === undefined || novaUrl === '') {
        novaUrl = this._limparUrl(location.href);
        Para:
        novaUrl ||= this._limparUrl(location.href);
  1.5 - parar imagens em Base64 nao afetarem o desempenho.
}
*/