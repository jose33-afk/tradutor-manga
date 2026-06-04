
// iniciarExtensao e uma funcao de teste
// Essa parte vai ficar na funcao principal do content.


//const Utils = {
  // config: null,

  // async gerenciarStorage(metodo, dados, escopo) {
  //   try {
  //     return await chrome.runtime.sendMessage({
  //       action: "GERENCIAR_STORAGE_ABA",
  //       escopo: escopo,
  //       metodo: metodo,
  //       dados: dados
  //     });
  //   } catch (e) {
  //     console.warn("[UrlMonitor] Falha na comunicação de Storage:", e);
  //     return { sucesso: false, dados: null };
  //   }
  // },

  // esperar: (ms) => new Promise(res => setTimeout(res, ms)),

  // debounce: (func, delay) => { // 1.4
  //   let timeoutId;
  //   return (...args) => {
  //     clearTimeout(timeoutId);
  //     timeoutId = setTimeout(() => func(...args), delay);
  //   };
  // },

  // async importarModulo(nomeArquivo, nomeObj = null) {
  //   const caminho = chrome.runtime.getURL(nomeArquivo);
  //   const modulo = await import(caminho);

  //   if (nomeObj) return modulo[nomeObj];
  //   return modulo;
  // },

  // async getConfigHardware() {
  //   const dadosHardware = await StorageManager.buscar('global', 'hardware');
  //   const perfil = dadosHardware?.perfil || 'NORMAL';
    
  //   const configHardware = {
  //     ULTRA:  { scroll: 250, retry: 300, tentativas: 40, debounceWait: 800, }, 
  //     NORMAL: { scroll: 400, retry: 500, tentativas: 30, debounceWait: 1200, }, 
  //     LOW:    { scroll: 750, retry: 1000, tentativas: 20, debounceWait: 1400, } 
  //   };

  //   this.config = configHardware[perfil];
  // },
//}

const PipelineManga = {
  Avisos: null,
  estado: {
    eventosProntos: false,
    scrollConcluido: false,
    imagensMapeadas: false,
    enviarProBackground: false, 
    capituloFinalizado: false,
  },

  resetarPipeline() {
    console.log("[Pipeline] Resetando estado (Novo capítulo detectado)."); // Somente para TESTES.

    this.estado.scrollConcluido = false; 
    this.estado.imagensMapeadas = false;
    this.estado.enviarProBackground = false;
    this.estado.capituloFinalizado = false;
    this.estado.eventosProntos = false;
    this._primeiraImagemSrc = null;

    if (typeof ScrollManager !== 'undefined') ScrollManager.destruirMemoria();
    if (typeof ImageScanner !== 'undefined') ImageScanner.destruirMemoria();
  },

  async init() {
    if (!this.Avisos) this.Avisos = await Utils.importarModulo('avisoManager.js', 'AvisoManager');
    
    if (!this.estado.eventosProntos) {
      await EventManager.init();
    }
  },
}

const ImageScanner = {
  _AVISOS: null,
  _Filter: null,
  _estadoFetch: null, // 2.7
  _totalImagens: 0,
  _cacheImagens: [],
  _estado: {
    totalFalhas: 0,
    limiteCritico: 0,
    tentouFallback: false,
    ignorarErrosFuturos: false,
  },

  _resetarEstadoLogico() {
    this._estadoFetch = null;
    this._totalImagens = 0;
    this._cacheImagens = [];
    this._estado = {
      totalFalhas: 0,
      limiteCritico: 0,
      tentouFallback: false,
      ignorarErrosFuturos: false
    };
  },

  destruirMemoria() {
    this._AVISOS = null;
    this._Filter = null;
    this._cacheImagens = null;
    console.log("[Scanner] Memória liberada. Módulos descarregados.");
  },

  extrairImagensDoDOM() {
    const scrollYAtual = window.scrollY;
    const scrollXAtual = window.scrollX;
    const images = document.getElementsByTagName('img');

    this._cacheImagens = Array.from(images).reduce((acumulador, img) => {
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

    return this._cacheImagens;
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

    const sucessos = []//resultados.filter(item => item?.imageDataUrl);
    const falhas = resultados.filter(item => !item?.imageDataUrl);
    
    if (isTestDrive && sucessos.length === 0 && lote.length > 0) {
      this._AVISOS.mostrarStatus('erro', 'Falha ao processar imagens. Bloqueio detectado.');
      return false;
    }

    // if (falhas.length > 0) { Tive um ideia melhor, vou implementala quando terminar de entender tudo.
    //   this._estado.totalFalhas += falhas.length; 

    //   if (this._estado.totalFalhas > this._estado.limiteCritico) {
    //    const continuar = this._AVISOS.verificarSecontinua({
    //       titulo: 'Alerta de Download',
    //       mensagem: `Muitas imagens falharam (${this._estado.totalFalhas} de ${this._totalImagens}). O site pode estar bloqueando a extensão ou as imagens são anúncios.\n\nDeseja continuar baixando assim mesmo?`,
    //       btnSim: 'Tentar novamente',
    //       btnNao: 'Parar'
    //     });

    //     if (!continuar) return false;
    //     this._estado.totalFalhas = 0;
    //   }
    // }

    if (sucessos.length > 0) {
      try {
        const isUltimoLote = (indexInicial + lote.length - 1) >= this._totalImagens; // 3.1 | 3.2
        //testes
        console.log('valor do calculo:', indexInicial + lote.length - 1);
        console.log('ultimo lote:', isUltimoLote);
        console.log('Total de imgs:', this._totalImagens)
        //testes
        //await this._enviarParaBackground(sucessos, isUltimoLote); funcao ainda n feita.
      } catch(e) {
        console.error("[prepararDespacharLote] Falha de comunicação:", e); //Vou remover depois.
        return false;
      }
    }


    //   Futuro Implementar Fallback Silencioso e Limite Crítico Dinâmico.
    // - Se fetch falhar, tentar Canvas.
    // - Atualizar UI com fases ("Ativando Canvas") em vez de travar o usuário.
    // 
    // REGRA: Permitimos pelo menos 3 falhas (ruídos comuns de anúncio/pixel) 
    // OU 15% do total, o que for MAIOR.
    // TETO DE SEGURANÇA: Nunca deixar passar de 12 falhas sem avisar, 
    // mesmo em capítulos gigantes de 100 páginas.
  }, 

  async _orquestrarVarredura(imgsFiltradas) {
    const tamanhoTesteDrive = Math.min(4, this._totalImagens);
    const loteTeste = imgsFiltradas.slice(0, tamanhoTesteDrive);
    
    const testeSucesso = await this._prepararDespacharLote(loteTeste, 1, true);
  },  

  async processar() {
    //if (!EventManager.permissaoParaRodar) return; DESATIVADO PARA TESTES
    
    try {
      this._resetarEstadoLogico();

      if (!this._AVISOS) this._AVISOS = await Utils.importarModulo('avisoManager.js', 'AvisoManager'); 
      if (!this._Filter) this._Filter = await Utils.importarModulo('filtro.js', 'filtroImg');

      const imgsFiltradas = this.extrairImagensDoDOM();
      this._totalImagens = imgsFiltradas.length;
      this._estadoFetch = { erros: 0 };

     
      // if (this._totalImagens === 0) {
      //   this._AVISOS.mostrarStatus('erro', 'Nenhuma imagem válida encontrada no site.');
      //   return false;
      // }

      // this._AVISOS.mostrarStatus('carregando', `Processando ${this._totalImagens} imagens...`);

      // /*const sucessoVarredura =*/ await this._orquestrarVarredura(imgsFiltradas);
      //return sucessoVarredura !== false;
    } catch (e) {
      if (this._AVISOS) this._AVISOS.mostrarStatus('erro', 'Falha crítica no processamento.');
      return false;
    } finally {
      this._resetarEstadoLogico();
    }
  },
}

const UrlMonitor = {
  _intervaloId: null,
  _cacheUrlLimpa: null,
  _cacheAssinatura: null,
  _AVISOS: null,
  _carregouDOM: null,
  _verificando: false,

  _limparUrl(urlBruta) {
    try {
      if (urlBruta.includes('mangadex.org')) return urlBruta.replace(/\/\d+\/?$/, ''); // 1.8
      return urlBruta;
    } catch(e) {
      return urlBruta;
    }
  },

  async _gerarAssinaturaDOM(maxTentativas = 10, delayMs = 500) { // 10 === 5s
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const ArrayImgs = Array.from(document.getElementsByTagName('img')).filter(
        img => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450
      );
    
      if (ArrayImgs.length >= 3) {
        let impressao = ArrayImgs.slice(0, 2)
            .map(img => {
              return img.src.replace(/^blob:/, '').split('/').pop().substring(0, 40) // 3.2
            }).join('');

        if (impressao.length > 10) return impressao;
      }
      await Utils.esperar(delayMs);
    }

    PipelineManga.resetarPipeline();
    return null;
  },

  async init() {
    if (this._intervaloId) clearInterval(this._intervaloId);
    this._AVISOS = await Utils.importarModulo('avisoManager.js', 'AvisoManager');

    this._cacheUrlLimpa = this._limparUrl(location.href);
    this._cacheAssinatura = await this._gerarAssinaturaDOM();
    
    await Utils.gerenciarStorage("salvar", { 
      cacheUrl: this._cacheUrlLimpa, 
      cacheAssinatura: this._cacheAssinatura 
    }, "aba");

    this._iniciarVigia();
  },

  _iniciarVigia() {
    this._intervaloId = setInterval(async () => {
      if (this._verificando) return;
      this._verificando = true;

      const urlAtual = this._limparUrl(location.href);
      const mudouUrl = urlAtual !== this._cacheUrlLimpa;

      let mudouAssinatura = false;
      let assinaturaAtual = null;

      if (!mudouUrl) {
        assinaturaAtual = await this._gerarAssinaturaDOM();
        mudouAssinatura = (assinaturaAtual && this._cacheAssinatura) 
            ? (assinaturaAtual !== this._cacheAssinatura)
            : false;
      }

      if (mudouUrl || mudouAssinatura) {
        if (mudouUrl && !assinaturaAtual) assinaturaAtual = await this._gerarAssinaturaDOM();

        this._lidarComMudanca(urlAtual, assinaturaAtual);
      }

      this._verificando = false;
    }, 1000);
  },

  async _lidarComMudanca(novaUrl, novaAssinatura) {
    if (!EventManager.permissaoParaRodar) return;
    clearInterval(this._intervaloId);

    this._verificando = false;
    this._cacheUrlLimpa = novaUrl;
    this._cacheAssinatura = novaAssinatura;

    await Utils.gerenciarStorage("salvar", { 
        cacheUrl: this._cacheUrlLimpa, 
        cacheAssinatura: this._cacheAssinatura 
    }, "aba");

    const resposta = await Utils.gerenciarStorage("buscar", ['idiomaConfig', 'idiomaOrigem', 'jaConfirmou', 'estaCorrendo'], "aba");
    const config = (resposta && resposta.sucesso) ? resposta.dados : {};

    if (!resposta.sucesso || !config.idiomaConfig || !config.jaConfirmou) {
      Utils.gerenciarStorage("salvar", { jaConfirmou:false, estaCorrendo: false }, "aba",);
  
      const respostaUsuario = await this._AVISOS.verificarSecontinua({
        titulo: 'Novo Capítulo Detectado',
        mensagem: 'Qual o idioma original deste mangá para iniciarmos a tradução?',
        btnSim: 'Iniciar Tradução',
        btnNao: 'Cancelar',
        opcoesSelect: [
          { valor: 'ja', texto: 'Japonês (Mangá)' },
          { valor: 'ko', texto: 'Coreano (Manhwa)' },
          { valor: 'zh', texto: 'Chinês (Manhua)' },
          { valor: 'en', texto: 'Inglês' },
          { valor: 'es', texto: 'Espanhol' },
          { valor: 'pt', texto: 'Português' }
        ]
      });

      if (respostaUsuario === false || respostaUsuario === 'ignorar') {
        PipelineManga.resetarPipeline();
        this._iniciarVigia();
        return;
      }

      await Utils.gerenciarStorage("salvar", {
        idiomaOrigem: respostaUsuario, 
          idiomaConfig: config.idiomaConfig || 'pt', 
          jaConfirmou: true, 
          estaCorrendo: true
      }, 'aba');

      //PipelineManga.executarTrabalho(); DESATIVADO, Pipeline indisponivel por enquanto.
      this._iniciarVigia();
      return;
    }
    
    if (config.jaConfirmou && config.estaCorrendo) {
      const origemStr = String(config.idiomaOrigem || 'auto').toUpperCase();
      const destinoStr = String(config.idiomaConfig || 'pt').toUpperCase();

      const continuar = await this._AVISOS.verificarSecontinua({
        titulo: 'Próximo Capítulo!',
        mensagem: `Continuando tradução automática (${origemStr} ➔ ${destinoStr}).`,
        btnSim: 'Traduzir Agora',
        btnNao: 'Pausar',
        tempoAutoFechamento: 5000 // 5s
      });

      if (continuar === false) {
        await Utils.gerenciarStorage("salvar", { jaConfirmou:false, estaCorrendo: false }, "aba");
        this._AVISOS.mostrarStatus('info', 'Tradução pausada. Inicie manualmente quando desejar.');
        this._iniciarVigia();
        return;
      }

      this._AVISOS.mostrarStatus('carregando', 'Traduzindo novo capítulo...', { persistente: false, tempo: 3000 });

      // PipelineManga.executarTrabalho(); DESATIVADO ATE TERMINAR O PIPELINE
    }

    this._iniciarVigia();

    // Antes de prosseguir terminar de migrar pro Utils.gerenciarStorage().
    // Eu estava aqui seguindo o gemini. depois de terminar falta testar e verificar todos os bugs, mas so vai dar 
    // para testar 100% quando terminar o Pipeline.
  },
}

const EventManager = {
  permissaoParaRodar: false,
  _listenerAtivo: false,

  async pararOperacaoGlobal() {
    this.permissaoParaRodar = false;

    try {
      const resposta = await Utils.gerenciarStorage("salvar", { estaCorrendo: false }, "aba");
      return resposta?.sucesso || false;
    } catch(e) {
      console.warn("Background inacessível no momento do desligamento.", e);
      return false;
    }
  },

  async _perguntarAoBackground() {
    try {
      const resposta = await Utils.gerenciarStorage("buscar", "estaCorrendo", "aba");

      if (resposta && resposta.sucesso) return { sucesso: true, valor: resposta.dados };
      else return { sucesso: false, erro: resposta?.erro || "falha na ao buscar o valor" };
    } catch(e) {
      return { sucesso: false, erro: e };
    }
  },

  async init() {
    await Utils.getConfigHardware();

    const sucessoBusca = await this._perguntarAoBackground() // 1.5
    if (!sucessoBusca.sucesso) {
      console.warn(sucessoBusca.erro)
      return false;
    }

    this.permissaoParaRodar = !!sucessoBusca.valor; // 3.5

    const conexaoPronta = (await this.conexaoBackground());
    if (!conexaoPronta.sucesso) {
      console.log(conexaoPronta?.erro || '[ conexaoBackground() ]: Erro ao estabelecer uma conexao');
      return false;
    }
    
    // this.conexaoBackground();
    // await this._verificarEstadoPosF5();
    
  },

  async conexaoBackground() {
    if (this._listenerAtivo) return { sucesso: true };
    
    try {
      chrome.runtime.onMesage.addListener((request, sender, sendResponse) => {
        if (request.action === 'INICIAR_TRADUCAO') {
          this.permissaoParaRodar = true;
          // PipelineManga.init();    //DESATIVADO pipeline em construcao
          sendResponse(); // 1.6
        }
        
        if (request.action === 'PARAR_TRADUCAO') {
          this.permissaoParaRodar = false;
          sendResponse(); 
        }
      });

      this._listenerAtivo = true;
      return { sucesso: true };
    } catch (e) {
      this._listenerAtivo = false;
      return { sucesso: false, erro: e };
    }
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
      PipelineManga.init();
    } else {
      this.pararOperacaoGlobal();
    }
  },
}

const ScrollManager = {
  _AVISOS: null,

  destruirMemoria() {
    this._AVISOS = null;
  },

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
    if (!this._AVISOS) this._AVISOS = await Utils.importarModulo('avisoManager.js', 'AvisoManager');
    
    this._AVISOS.mostrarStatus('carregando', 'Mapeando páginas');

    let elementoScroll = await this._encontrarElementoComRetry(); 
    const sucesso = await this.carregarPaginaManga(elementoScroll);
    
    if (sucesso) {
      this._AVISOS.mostrarStatus('subindo', { tempo: 2000 });

      const alvoEvento = this._getAlvoEvento(elementoScroll);
      alvoEvento.scrollTo({ top: 0, behavior: 'auto' }); // Ajustar isso ta teleportando pro topo.

      this._AVISOS.mostrarStatus('fechar', 'Pronto para proxima fase');
      //PipelineManga.init(); DESATIVADO PARA TESTES.
    } else { 
      this._AVISOS.mostrarStatus('erro', 'Falha ao percorrer o mangá.'); 
    }

    return sucesso;
  },
}

// async function teste() {
//   await iniciarExtensao()
//   // const event = await Utils.importarModulo('modules/eventManager.js', 'eventManager');
//   const utils = await importarModulo("modules/utils.js", "utils");
// }

// teste()

// Estava aqui testando o importarModulo
async function testarBarreiraDeErros() {
  // 1. Liga o escudo

  console.log("🛡️ INICIANDO TESTES DA BARREIRA...");

  // ========================================================
  // TESTE 1: ARQUIVO FANTASMA (Dispara o CATCH vermelho)
  // O que simula: Você esqueceu de colocar o arquivo na pasta, 
  // ou não botou no manifest, ou digitou o nome do arquivo errado.
  // ========================================================
  console.log("👉 Teste 1: Tentando importar um arquivo que não existe");
  
  const operarioZumbi = await importarModulo("arquivo_que_nao_existe.js");
  
  // A barreira tem que retornar 'null' em vez de crashar a extensão
  if (operarioZumbi === null) {
    console.log("✅ Defesa 1 Funcionou: O sistema continuou rodando de boa porque a função devolveu null.");
  }


  // ========================================================
  // TESTE 2: EXPORT ERRADO (Dispara o WARN amarelo)
  // O que simula: O arquivo utils.js existe, mas você digitou 
  // o nome da classe errado no segundo parâmetro (ex: 'Utilz' com Z)
  // ========================================================
  console.log("\\n👉 Teste 2: Tentando puxar uma classe com nome errado");
  
  // No seu utils.js a classe se chama 'utils', vou pedir 'UtilsComNomeErrado'
  const classeMisteriosa = await importarModulo("modules/utils.js", "UtilsComNomeErrado");
  
  // A barreira vai dar um console.warn te xingando, e o retorno será undefined
  if (classeMisteriosa === undefined) {
    console.log("✅ Defesa 2 Funcionou: O sistema te avisou que o export não existe.");
  }

  console.log("\\n🚀 Testes finalizados. A sua extensão não crashou!");
}

testarBarreiraDeErros();


/*
  - POS ISSO EU POSSO VOLTAR PRO PIPELINE 
  - E DEPOIS PRO IMGSCANNER.
*/




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
  3.1 - o -1 e aquela coisa de 0 contar entao seria 0, 1, 2, 3, e n 1, 2, 3, 4. O 
        O calculo e simples eu pego o indexInicial e somo com o tamanho do lote atual e vejo se atinje o teto se sim
        Entao e o ultimo senao nao e o ultimo. 
  3.2 - Pega só o que vem depois da última '/'
  3.3 - verifica se ambas existem antes de comparar
  3.4 - melhor deixar assim para nao ter que por await nas outras chamadas
  3.5 - !! garante que null/undefined se tornem o booleano false.
*/