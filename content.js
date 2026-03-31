const PipelineManga = {
  estado: {
    scrollConcluido: false,
    imagensMapeadas: false,
    enviarProBackground: false, 
    capituloFinalizado: false,
  },

  imagensCache: [],

  async executarTrabalho() {
    if (!EventManager.permissaoParaRodar) return;
    if (!this.estado.capituloFinalizado) return;

    if (!this.estado.scrollConcluido) {
      const scrollSucesso = await ScrollManager.executarDescidaPrincipal();

      if (!scrollSucesso) return; 
      this.estado.scrollConcluido = true; 
    }

    if (!this.estado.imagensMapeadas) {
      console.log("[Pipeline] Identificado: Falta mapear as imagens.");

    }

    this.estado.capituloFinalizado = true; // 2.9
  }


}

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

  async importarModulo(nomeArquivo, nomeObj = null) {
    const caminho = chrome.runtime.getURL(nomeArquivo);
    const modulo = await import(caminho);

    if (nomeObj) return modulo[nomeObj];
    return modulo;
  },

  async getConfigHardware() {
    const dadosHardware = await StorageManager.buscar('global', 'hardware');
    const perfil = dadosHardware?.perfil || 'NORMAL';
    
    const configHardware = {
      ULTRA:  { scroll: 250, retry: 300, tentativas: 40, debounceWait: 800, usarLotes: false }, 
      NORMAL: { scroll: 400, retry: 500, tentativas: 30, debounceWait: 1200, usarLotes: true, taxaLote: 0.15 }, 
      LOW:    { scroll: 750, retry: 1000, tentativas: 20, debounceWait: 1400, usarLotes: true, taxaLote: 0.08 } 
    };

    this.config = configHardware[perfil];
  },
}

const ImageScanner = {
  _AVISOS: null,
  _Filter: null,
  _estadoFetch: null, // 2.7
  _estado: {
    totalFalhas: 0,
    limiteCritico: 0,
  },
   
  

  extrairImagensDoDOM() {
    const scrollYAtual = window.scrollY;
    const scrollXAtual = window.scrollX;
    const images = document.getElementsByTagName('img');

    return Array.from(images).reduce((acumulador, img) => {
      if (img.naturalHeight > img.naturalWidth && img.naturalWidth > 450) {
        const rect = img.getBoundingClientRect();
        acumulador.push({
          elemento: img,
          posicoes: {
            topo: rect.top + scrollYAtual,
            esquerda: rect.left + scrollXAtual,
            larguraTela: rect.width,
            alturaTela: rect.height,
            larguraReal: img.naturalWidth,
            alturaReal: img.naturalHeight
          }
        });
      }
      return acumulador;
    }, []);
  },

  async _prepararDespacharLote(lote, indexInicial, isTestDrive) {
    const resultados = await Promise.all(
      lote.map(async (item, i) => { 
        try {
          return await this._Filter(
            item.elemento,
            item.elemento.src,
            indexInicial + i, // 2.8
            this._estadoFetch,
            item.posicoes
          );
        } catch (e) {
          return { index: indexInicial + i, erro: e.message || "Erro inesperado" }; // 3.0
        }
      })
    );

    const sucessos = resultados.filter(item => item?.imageDataUrl);
    const falhas = resultados.filter(item => !item?.imageDataUrl);
    
    if (isTestDrive && sucessos.length === 0 && lote.length > 0) {
      this._AVISOS.mostrarStatus('erro', 'Falha ao processar imagens. Bloqueio detectado.');
      return false;
    }

    // if (falhas.length > 0) {
    //   this._estado.totalFalhas += falhas.length;

    //   if (this._estado.totalFalhas > this._estado.limiteCritico) {
    //    this._AVISOS.verificarSecontinua({
    //       titulo: 'Alerta de Download',
    //       mensagem: `Muitas imagens falharam (${this._estado.totalFalhas} de ${this._totalImagens}). O site pode estar bloqueando a extensão ou as imagens são anúncios.\n\nDeseja continuar baixando assim mesmo?`,
    //       btnSim: 'Tentar novamente',
    //       btnNao: 'Parar'
    //     });
    //   }
    // }
  }, 

  async _orquestrarVarredura(imgsFiltradas) {
    const tamanhoTesteDrive = Math.min(4, this._totalImagens);
    const loteTeste = imgsFiltradas.slice(0, tamanhoTesteDrive);
    
    const testeSucesso = await this._prepararDespacharLote(loteTeste, 1, true);
  },  

  async processar() {
    //if (!EventManager.permissaoParaRodar) return; DESATIVADO PARA TESTES

    try {
      if (!this._AVISOS) this._AVISOS = await Utils.importarModulo('avisoManager.js', 'AvisoManager'); 
      if (!this._Filter) this._Filter = await Utils.importarModulo('filtro.js', 'filtroImg');

      const imgsFiltradas = this.extrairImagensDoDOM();
      this._totalImagens = imgsFiltradas.length;
      this._estadoFetch = { erros: 0 };

      if (this._totalImagens === 0) {
        this._AVISOS.mostrarStatus('erro', 'Nenhuma imagem válida encontrada no site.');
        return false;
      }

      this._estado.limiteCritico = Math.max(10, Math.ceil(this._totalImagens * 0.25));
      this._AVISOS.mostrarStatus('carregando', `Processando ${this._totalImagens} imagens...`);

      /*const sucessoVarredura =*/ await this._orquestrarVarredura(imgsFiltradas);
      //return sucessoVarredura !== false;
    } catch (e) {
      if (this._AVISOS) this._AVISOS.mostrarStatus('erro', 'Falha crítica no processamento.');
      return false;
    } finally {
      this._Filter = null;
      this._estadoFetch = null;
      this._totalImagens = 0;
    }
  },
}

const UrlMonitor = {
  _intervaloId: null,
  _cacheUrlLimpa: null,

  _limparUlr(urlBruta) {
    try {
      if (urlBruta.includes('mangadex.org')) return urlBruta.replace(/\/\d+\/?$/, ''); // 1.8
      return urlBruta;
    } catch(e) {
      return urlBruta;
    }
  },

  init() {
    if (this._intervaloId) clearInterval(this._intervaloId); // 1.9

    this._cacheUrlLimpa = this._limparUlr(location.href);
    
    this._intervaloId = setInterval(() => {
      const urlAtualLimpa = this._limparUlr(location.href);

      if (urlAtualLimpa !== this._cacheUrlLimpa) {
        this._cacheUrlLimpa = urlAtualLimpa;

        EventManager.permissaoParaRodar = false;
      
        try {
          chrome.runtime.sendMessage({
            action: 'ATUALIZAR_STORAGE_ABA', 
            novosDados: { 
              ultimaUrl: urlAtualLimpa,
              jaConfirmou: false,  
              estaCorrendo: false  
            }
          });
        } catch (e) {};
      }
    }, 1000);
  }
}

const EventManager = {
  permissaoParaRodar: false,

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
    await this._verificarEstadoPosF5();

    UrlMonitor.init();
  },

  async conexaoBackground() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'INICIAR_TRADUCAO') {
        this.permissaoParaRodar = true;
        PipelineManga.executarTrabalho();
        sendResponse(); // 1.6
      }

      if (request.action === 'PARAR_TRADUCAO') {
        this.permissaoParaRodar = false;
        sendResponse(); 
      }
    });
  },

  async _verificarEstadoPosF5() { // 2.0
    if (!this.permissaoParaRodar) return; 
    const Aviso = await Utils.importarModulo('avisoManager.js', 'AvisoManager');
    
    const querRetomar = await Aviso.verificarSecontinua({
        titulo: 'Retomar Leitura?',
        mensagem: 'A página recarregou. Deseja continuar a varredura deste capítulo?',
        btnSim: 'Retomar',
        btnNao: 'Parar'
    });

    if (querRetomar) {
      this.permissaoParaRodar = true
      PipelineManga.executarTrabalho();
    } else {
      this.permissaoParaRodar = false;

      try {
        chrome.runtime.sendMessage({ // TROCAR PELA FUNCAO PARAOPERACAOGLOBAL QUE VOU FAZER
            action: 'ATUALIZAR_STORAGE_ABA',
            novosDados: { estaCorrendo: false }
        });
      } catch(e) {}
    }
  },
}

const ScrollManager = {
  _AVISOS: null,

  _chegouAoFim (scroller) {
    const total = scroller.scrollHeight || document.documentElement.scrollHeight;
    const visivel = scroller === window ? window.innerHeight : scroller.clientHeight;
    const atual = scroller === window ? window.scrollY : scroller.scrollTop;
    return atual + visivel >= total - 100;
  },

  async scrollSeguro(element) {
    return new Promise((resolve) => {
      const tempoAnimacao = Utils.config.scroll;
      
      const alvo = this._getAlvoEvento(element);

      requestAnimationFrame(() => {
        alvo.scrollBy({
          top: window.innerHeight * 0.8, 
          behavior: 'auto' 
        });
        
        setTimeout(resolve, tempoAnimacao); 
      });
    });
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

    console.warn("Nenhum container específico achado, usando Window.");
    return window;
  },

  async _executarAutoScroll(scroller, estado, limparEvento) {
    let alturaAnterior = this._getAltura(scroller);
    let tentativasSemMudanca = 0;
    const LIMITE_TENTATIVAS = 3;

    while (tentativasSemMudanca < LIMITE_TENTATIVAS) { // 2.6
      if (estado.finished) return;
      if (!EventManager.permissaoParaRodar) return limparEvento(false); // 2.4 | 2.5

      await this.scrollSeguro(scroller);
      await Utils.esperar(Utils.config.retry);

      if (estado.finished) return;

      if (this._chegouAoFim(scroller)) {
        let alturaAtual = this._getAltura(scroller);
        if (alturaAtual > alturaAnterior) {
          alturaAnterior = alturaAtual;
          tentativasSemMudanca = 0;
        } else { tentativasSemMudanca++ }
      }
    }

    if (!estado.finished) limparEvento(this._chegouAoFim(scroller));
  },

  _getAltura(scroller) {
    return scroller.scrollHeight || document.documentElement.scrollHeight;
  },

  _getAlvoEvento(scroller) {
    return (scroller === document.documentElement || scroller === document.body || !scroller) 
      ? window 
      : scroller;
  },

  carregarPaginaManga(scroller) {
    return new Promise((resolve) => {
      const estado = { // 2.3
        finished: false,
        verificandoFalsoFim: false
      };
      
      const alvoEvento = this._getAlvoEvento(scroller);

      const limparEvento = (resultado) => {
        estado.finished = true;
        alvoEvento.removeEventListener('scroll', monitorManual);
        resolve(resultado);
      };

      const monitorManual = Utils.debounce(async () => {
        if (!EventManager.permissaoParaRodar || estado.finished || estado.verificandoFalsoFim) return;
          if (this._chegouAoFim(scroller)) {
            estado.verificandoFalsoFim = true; // 2.2
            const alturaAntes = this._getAltura(scroller);
          
            await Utils.esperar(Utils.config.retry);

            if (estado.finished) return;

            const alturaDepois = this._getAltura(scroller);

            if (this._chegouAoFim(scroller) && alturaDepois <= alturaAntes) limparEvento(true);
            else estado.verificandoFalsoFim = false;
        }
      }, Utils.config.debounceWait);

      alvoEvento.addEventListener('scroll', monitorManual);

      this._executarAutoScroll(scroller, estado, limparEvento);
    });
  },
  
  async executarDescidaPrincipal() {
    this._AVISOS = await Utils.importarModulo('avisoManager.js', 'AvisoManager');
    let elementoScroll = await this._encontrarElementoComRetry(); 
    const sucesso = await this.carregarPaginaManga(elementoScroll);
    
    if (sucesso) {
      this._AVISOS.mostrarStatus('subindo');

      const alvoEvento = this._getAlvoEvento(elementoScroll);
      alvoEvento.scrollTo({ top: 0, behavior: 'auto' });

      await Utils.esperar(2000);
      this._AVISOS.mostrarStatus('fechar');

      this._AVISOS = null;
      //PipelineManga.executarTrabalho();
    } else { 
      this._AVISOS.mostrarStatus('erro', 'Falha ao percorrer o mangá.'); 
      this._AVISOS = null;
    }

    return sucesso;
  },
}

EventManager.init();
//ImageScanner.processar()
setTimeout(() => ImageScanner.processar(), 5000);


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
  1.8 - MangaDex ultiliza um sisteminha que adiciona que fica mudando um numero no final da URL,
        e toda vez que muda uma imagem rolando para baixo  meu programa detecta como se tivesse mudado de capitolo.
  1.9 - Evita rodar dois monitores ao mesmo tempo se chamar a função duas vezes
  2.0 - Nao precisa de nenhum codigo monitorando, pos quando se da F5 o content e recriado.
  2.1 - Trava de segurança
  2.2 - Isso aqui e uma trava pra nao ficar mais de uma funcao na memoria por vez, por causa do await que e maior que o time do debonce.
  2.3 - nao da pra passar bloano por parametro pq senao ele pega uma copia e nao o original, pra monitorar o real de fato usamos obj
  2.4 - aqui e como se eu fisse assim return 2+2 e ele retornaria 4 e a mesma coisa ele chama a funca e retorna o resultado dela
        com ela n retorna nada o retorn e undefied mas n tem problema. o bom e que ela encerra a funcao msm estando dentro de um while.
  2.5 - Ele esta aqui por preucacao basicamente se apertar em parar o monitor n se fecha pq n tem mais scroll mas scroll e para limpar memoria 
        encerramos la no while que n morre de primeira se desligar a extensao.
  2.6 - Esse 3 tentativas fica de emergencia mesmo que o monitorar na maioria das vezes funcione... ou caso o monitor seja apressado demais o AutoScroll chama 
        o monitor de volta
  2.7 - Apenas vivos durante o processar, apagados no final
  2.8 - O calculo do index nunca da erro pq o indexInicial nunca muda ex:
        5 + 0 + 5 + 1 + 5 + 2 + 5 + 3 + 5 + 4
        index: 5, 6, 7, 8, 9 
        eu nao estou somando 5 + 6 + 7 + 8 + 9.
  2.9 - serve pra dizer que o capitolo ja foi processado.
  3.0 - Por seguranca pode ocorrer algum erro em uma img especifica e o promisse.all excluir todas a que deram certo
*/