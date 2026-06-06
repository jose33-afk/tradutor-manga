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

    if (!this.#cacheAssinatura) {
      console.error("Erro Crítico: Falha no sistema unificado de identificação (Assinatura do DOM falhou ou página está sem imagens)!");
      //chama o event managar para para resetar o pipeline.
    }

    await this.#Utils.gerenciarStorage("salvar", { 
      cacheUrl: this.#cacheUrlLimpa, 
      cacheAssinatura: this.#cacheAssinatura 
    }, "aba");
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
      
      await this.#Utils.esperar(delayMs);
    }

    return null;
  }

  //Eu estava aqui o vigia n esta funcionando eu devo ter esquecido de algo
  // e falta testar conforme estava fazendo abaixo
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
          
          console.log('mudou url ou assinatura', mudouUrl, 'assinatura?', mudouAssinatura)
          console.log('anteriores: url:', this.#cacheUrlLimpa, 'assinatura', this.#cacheAssinatura)
          //this.#lidarComMudanca(urlAtual, assinaturaAtual);
        }

        console.log('nao mudou ')

      } finally {
        this.#verificando = false; // 1.3
      }
    }, 1000);
  }
}

/*
  1.1 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
  1.2 - Pega só o que vem depois da última '/'
  1.3 - Mesmo que qualquer coisa dê erro fatal dentro do 'try', o JS joga a trava pra false
        garantindo que o monitor nunca trave silenciosamente.
*/