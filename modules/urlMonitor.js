export class UrlMonitor {
  #intervaloId = null;
  #cacheUrlLimpa= null;
  #cacheAssinatura = null;
  #Avisos = null;
  #Utils = null;
  #carregouDOM = null;
  #verificando = false;
  #isMangaDex = false;
  #gatilhoVerificacao = null;

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
    
    // if (!this.#isAssinaturaValida(this.#cacheAssinatura)) {
    //   console.error("Erro Crítico: Falha no sistema unificado de identificação (Assinatura do DOM falhou ou página está sem imagens)!");
    //   //chama o event managar para para resetar o pipeline.
    // }

    await this.#Utils.gerenciarStorage("salvar", { 
      cacheUrl: this.#cacheUrlLimpa, 
      cacheAssinatura: this.#cacheAssinatura 
    }, "aba");  
    
    
    this.#gatilhoVerificacao = this.#Utils.debounce(() => this.#verificarAlteracoes(), 500); //2.0
    this.#ativarMonitoramentoURL();
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
            }
            return this.#gerarHash(`${srcBase}-${img.naturalHeight}`);
          }).join('-');

        if (impressao.length > 5) return impressao;
      } 
      await this.#Utils.esperar(delayMs);
    }

    return null;
  }

  #gerarHash(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      hash = (hash << 5) - hash + char; // 1.6 
      hash &= hash; // 1.7
    }
    return Math.abs(hash).toString(36); // 1.8
  }

  #isAssinaturaValida(assinatura) {
    if (typeof assinatura !== 'string' || assinatura.length < 5) return false;
    const formatoExato = /^[a-z0-9]+-[a-z0-9]+$/i; // 1.9
    return formatoExato.test(assinatura);
  }
 
  async #verificarAlteracoes() {
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
        if (mudouUrl && !assinaturaAtual) {
            assinaturaAtual = await this.#gerarAssinaturaDOM();
        }
        
        // this.#lidarComMudanca(urlAtual, assinaturaAtual);
        console.log("Mudança detectada! Preparando para chamar lidarComMudanca...");
      } else {
        console.log('nao mudou');
      }

    } finally {
      this.#verificando = false; 
    }
  }

  #ativarMonitoramentoURL() {
    const scriptInjetar = document.createElement('script');
    scriptInjetar.src = chrome.runtime.getURL('/injetor.js');

    (document.head || document.documentElement).appendChild(scriptInjetar); // 2.1
    
    //scriptInjetor.onload = () => scriptInjetor.remove();

    window.addEventListener('urlMudouSilenciosamente', () => console.log('url mudou'))
    window.addEventListener('popstate', () => console.log('clicou nos bnts do navegador'));
  }


  async #lidarComMudanca(novaUrl, novaAssinatura) {
    console.log('--- INÍCIO DA DETECÇÃO ---');
    console.log('1. Url recebida:', novaUrl);
    console.log('2. Assinatura recebida:', novaAssinatura);

    novaUrl ||= this.#limparUrl(location.href);

    if (!this.#isAssinaturaValida(novaAssinatura)) {
      console.warn('Assinatura ausente ou inválida. Gerando uma nova...');
      novaAssinatura = await this.#gerarAssinaturaDOM();
    }

    if (!this.#isAssinaturaValida(novaAssinatura)) {
      console.error("Erro Crítico: Assinatura do DOM falhou (página sem imagens válidas)!");
      // EventManager.resetarPipeline();
      return; 
    }

    console.log('--- DADOS VALIDADOS ---');
    console.log('3. Url final pronta:', novaUrl);
    console.log('4. Assinatura final pronta:', novaAssinatura);
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
  1.6 - Multiplica o hash por 31 (hash * 32 - hash) isso e a mesma coisa que 
        hash * 32 - 1 == 31. o + char e so para somar com resultado anterior.
  1.7 - Força o JavaScript a tratar como Inteiro de 32 bits (evita estouro de memória)
        Para o numero n ficar grande demais.
  1.8 - Converte o resultado para positivo e depois para Base36 (letras minúsculas e números)
  1.9 - Formato esperado: hash1-hash2 (Ex: "qum1ig-s1ed6i")
  2.0 - usamos arrow function aqui para podermos usar o this da classe e quando o debounce for usala n quebrar,
        ja que funcoes anonimas herdam o this.
  2.1 - É aquele esquema de usar o ||, funcina porque eu coloco parenteces para ordem de precedencia.
*/