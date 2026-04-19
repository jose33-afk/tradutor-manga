const Dicionario = {
  erro: [
    "⚠️ <strong>A página mudou.</strong> Serviço pausado. Configure novamente.", 
    "⚠️ Escolha idiomas diferentes para traduzir!" ,
  ],                             
  aviso: [
    // Se precisar de avisos amarelos no futuro, coloque aqui
  ],
  info: [
    "⚠️ Serviço pausado manualmente."                                            
  ]
};

const PerformanceManager = {
  obterPerfil() {
    const nucleos = navigator.hardwareConcurrency || 4;
    const inicio = performance.now(); // 2.5
    let iteracoes = 0;

    while (performance.now() - inicio < 50) {
      Math.sqrt(Math.random() * Math.random());
      iteracoes++;
    }
    
    if (nucleos >= 8 && iteracoes > 250000) return "ULTRA";
    if (nucleos >= 4 && iteracoes > 120000) return "NORMAL";
    return "LOW";
  },

  async verificarEatualizarHardware() {
    const agora = Date.now();
    const tempo15Dias = 15 * 24 * 60 * 60 * 1000;

    const { dados: dadosHardware } = await StorageManager.executarSeguro('buscar', 'global', 'hardware'); // 2.6
    
    if ((!dadosHardware || agora - (dadosHardware.ultimoTeste || 0) > tempo15Dias)) {
      const novoPerfil = this.obterPerfil();

      await StorageManager.executarSeguro('salvar', 'global', {
        hardware: {
          perfil: novoPerfil,
          ultimoTeste: agora
        }
      });
    }
  }
}

const InterfaceManager = {
  tabIdAtual: null,
  idiomaSugerido: null,
  el: {}, 

  detector: {
    mapeamento: { 
      'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 
      'pt': 'pt', 'pt-br': 'pt', 'en': 'en', 'en-us': 'en', 'es': 'es' 
    },

    converter(langBruto) {
      if (!langBruto || langBruto.trim() === "") return 'en';
      const langMinusculo = langBruto.toLowerCase().trim();
      if (this.mapeamento[langMinusculo]) return this.mapeamento[langMinusculo];
      return this.mapeamento[langMinusculo.split('-')[0]] || 'en';
    },
  },

  async init() {
    this.el = {
      btnLigar: document.querySelector('#btnLigar'),
      selectOrigem: document.querySelector('#selectOrigem'),
      selectTraducao: document.querySelector('#selectIdioma'),
      secaoConfirmacao: document.querySelector('#secaoConfirmacao'),
      textoConfirmacao: document.querySelector('#textoConfirmacao'),
      textoSugestao: document.querySelector('#idiomaSugerido'),
      containerBotoes: document.querySelector('#containerBotoesSimNao'),
      btnSim: document.querySelector('#btnSim'),
      btnNao: document.querySelector('#btnNao'),
      alertaErro: document.querySelector('#alertaStatus')
    };

    try {
      this.tabIdAtual = await StorageManager.getTabId();

      await PerformanceManager.verificarEatualizarHardware();

      const { dados } = await StorageManager.executarSeguro('buscar', this.tabIdAtual, 'tudo');

      this.el.selectTraducao.value = dados.idiomaConfig;

      if (dados.estaCorrendo || dados.jaConfirmou) {
        this._liberarInterfacePronta(dados.idiomaOrigem, dados.estaCorrendo);
      } else {
        const { dados: ultimoIdioma } = await StorageManager.executarSeguro('buscar', 'global', 'ultimoIdiomaOrigem');

        if (ultimoIdioma) {
          this.idiomaSugerido = ultimoIdioma;
        } else {
          const resultado = await chrome.scripting.executeScript({
            target: { tabId: this.tabIdAtual },
            func: () => document.documentElement.lang
          });

        this.idiomaSugerido = this.detector.converter(resultado[0]?.result);
        }
        
        this._iniciarFluxoSeguranca();
      }

      this._registrarEventos();
    } catch(e) {
      console.error("Erro na inicialização da Interface:", e); // 2.3
      this.el.selectOrigem.disabled = false;
      this._registrarEventos();
    }
  },

  async handleAlternarServico () {
    if (!this._validarIdiomas()) return;

    const { dados: dadosAtuais } = await StorageManager.executarSeguro('buscar', this.tabIdAtual, 'tudo');
    const novoEstado = !dadosAtuais.estaCorrendo;

    if(novoEstado) {
      await StorageManager.executarSeguro('salvar', this.tabIdAtual, {
        estaCorrendo: true,
        idiomaOrigem: this.el.selectOrigem.value,
        idiomaConfig: this.el.selectTraducao.value,
        jaConfirmou: true
      });

      await StorageManager.executarSeguro('salvar', 'global', { ultimoIdiomaOrigem: this.el.selectOrigem.value }); //2.4
      this._setBotaoEstado(true);
      window.close();
    } else {
      await StorageManager.executarSeguro('salvar', this.tabIdAtual, { estaCorrendo: false });
      this._setBotaoEstado(false);
      window.close();
    }
  },

  _registrarEventos() {
    this.el.btnSim.addEventListener('click', async () => {
      await StorageManager.executarSeguro('salvar', this.tabIdAtual, { idiomaOrigem: this.idiomaSugerido, jaConfirmou: true });
      await StorageManager.executarSeguro('salvar', 'global', { ultimoIdiomaOrigem: this.idiomaSugerido });
      this._liberarInterfacePronta(this.idiomaSugerido);
    });

    this.el.btnNao.addEventListener('click', () => {
      this.el.containerBotoes.classList.add('oculto');
      this.el.secaoConfirmacao.className = 'secao-confirmacao modo-aviso';
      this.el.textoConfirmacao.className = 'texto-destaque';
      this.el.textoConfirmacao.innerText = 'SELECIONE A ORIGEM NA LISTA ABAIXO';

      this.el.selectOrigem.disabled = false;
      this.el.selectOrigem.value = "";
      this._validarIdiomas(); 
    });

    this.el.selectOrigem.addEventListener('change', () => {
      this._validarIdiomas();
      this.el.secaoConfirmacao.className = 'secao-confirmacao oculto';
    });

    this.el.selectTraducao.addEventListener('change', () => this._validarIdiomas());
    this.el.btnLigar.addEventListener('click', () => this.handleAlternarServico());
  },

  _iniciarFluxoSeguranca() {
    this.el.secaoConfirmacao.className = 'secao-confirmacao modo-pergunta';
    this.el.textoConfirmacao.className = 'texto-pergunta';
    this.el.textoConfirmacao.innerHTML = 'O mangá está em <strong id="idiomaSugerido">---</strong>?';
    
    this.el.textoSugestao = document.querySelector('#idiomaSugerido');
    this.el.textoSugestao.innerText = this.idiomaSugerido.toUpperCase();

    this.el.containerBotoes.classList.remove('oculto');
    this.el.selectOrigem.value = this.idiomaSugerido;
    
    this.el.btnLigar.disabled = true;
    this.el.btnLigar.className = 'btn-desabilitado';
  },

  _liberarInterfacePronta(idioma, jaEstavaLigado = false) {
    this.el.secaoConfirmacao.className = 'secao-confirmacao oculto';
    if (idioma) this.el.selectOrigem.value = idioma;
    
    this.el.selectOrigem.disabled = false;
    this._setBotaoEstado(jaEstavaLigado);
    this._validarIdiomas();
  },

  _validarIdiomas() {
    const origem = this.el.selectOrigem.value;
    const destino = this.el.selectTraducao.value;

    if (origem && destino && origem === destino) {
      this.el.alertaErro.innerHTML = Dicionario.erro[1];
      this.el.alertaErro.style.display = 'block'; 
      
      this.el.btnLigar.disabled = true;
      this.el.btnLigar.className = 'btn-desabilitado';
      return false;
    }

    this.el.alertaErro.style.display = 'none';
    
    if (origem && !this.el.selectOrigem.disabled) {
      this.el.btnLigar.disabled = false;
      this.el.btnLigar.classList.remove('btn-desabilitado');
    
      if (!this.el.btnLigar.classList.contains('btn-rodando')) {
         this.el.btnLigar.className = 'btn-parado';
      }
    } else {
      this.el.btnLigar.disabled = true;
      this.el.btnLigar.className = 'btn-desabilitado';
    }
    return true;
  },

  _setBotaoEstado(rodando) {
    if (rodando) {
      this.el.btnLigar.innerText = "PARAR TRADUÇÃO";
      this.el.btnLigar.className = 'btn-rodando';
    } else {
      this.el.btnLigar.innerText = "LIGAR E ATUALIZAR";
      this.el.btnLigar.className = 'btn-parado';
    }
  },
}

document.addEventListener('DOMContentLoaded', () => InterfaceManager.init());

/*
  1.1 - Usamos [key] para que o JS entenda: "use o VALOR da variável key como nome da propriedade"
  1.2 - Já aceita 'idioma' OU ['idioma', 'estaCorrendo'] nativamente!
  1.3 - Se estava rodando, mas a URL mudou
  1.4 - TRAVA O BOTÃO: O usuário não pode clicar em nada!
  1.5 - PARAR O SERVIÇO
  1.6 - o listener n morre so porque ele encerrou a funcao hand, ele so morre quando fecha a janelinha.
  1.7 - usamos o molde de variaveisBase para não dar erro. no salvar tem uma parte que cria se n existir.
  1.8 - o ! so inverte o resultado da verificacao que esta colado
  1.9 - se ja estiver correndo
  2.0 -  Restaura o visual original da caixa (caso tenha sido transformada antes)
  2.1 - Restaura o texto e a margem do parágrafo
  2.2 - Encolhe e estiliza o container para parecer o modelo ".alerta-info"
  2.3 - Se o executeScript falhar, libera o select manual para o usuário não travar
  2.4 - Salva globalmente para as próximas abas
  2.5 - isso e um date.now() potente, e e tipo um cronometro que comeca do zero.
  2.6 - A esquerda do : É o nome da "gaveta" (chave) que já existe dentro do objeto que você recebeu.
        A direita do : É o nome da "variável" nova que você quer criar para guardar aquele valor

        // Criando um objeto (O valor vai para a chave):
        const obj = { chave: valor };

        // Desestruturando (O valor sai da chave para a variável):
        const { chave: variavel } = obj;
*/