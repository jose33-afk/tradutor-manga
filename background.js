importScripts(
  'storageManager.js',
  'ocr_service.js',
);

const Banco = {
  // LISTA PRINCIPAL: Adicione novos sites de Leitura grandes aqui.
  gavetasOficiais: ["mangaplus.shueisha.co.jp", "mangadex.org"],
  novasGavetas: ["outros_sites"],

  criarGavetas(linkDB) {
    const todasAsGavetas = [ ...this.gavetasOficiais, ...this.novasGavetas ];
    
    todasAsGavetas.forEach(site => {
      if (!linkDB.objectStoreNames.contains(site)) {  // 1.0
        linkDB.createObjectStore(site, { keyPath: "capituloUrl" });
      };
    });
  },

  async conectar() {
    return new Promise((resolve, reject) => { 
      const pedido = indexedDB.open("MangaCache", 1); //1 

      pedido.onupgradeneeded = (e) => { // 1.1
        const linkDB = e.target.result; // 1.2

        // DELETAR GAVETAS.
        // if (linkDB.objectStoreNames.contains("nome da gaveta")) {
        //   linkDB.deleteObjectStore("nome da gaveta");
        // };

        this.criarGavetas(linkDB);
      };

      pedido.onsuccess = () => resolve(pedido.result); // 1.3
      pedido.onerror = (e) => reject("Erro fatal ao abrir o banco:", e.target.error);
    });
  },

  async buscar(site, url) {
    const linkDB = await this.conectar();
    const gavetaNome = this._definirGaveta(site);
    
    return new Promise((resolve) => {
      const operacao = linkDB.transaction([gavetaNome], "readonly"); // 1.4
      const gavetaAberta = operacao.objectStore(gavetaNome);
      const pedido = gavetaAberta.get(url);

      pedido.onsuccess = () => {
        linkDB.close();
        resolve(pedido.result);
      };

      pedido.onerror = () => {
        linkDB.close();
        resolve(null);
      };
    });
  },

  async salvar(site, dados) {
    const linkDB = await this.conectar();
    const gavetaNome = this._definirGaveta(site);
    
    return new Promise((resolve, reject) => { // 1.5
      const operacao = linkDB.transaction([gavetaNome], "readwrite");// 1.6
      const gavetaAberta = operacao.objectStore(gavetaNome);

      gavetaAberta.put(dados);

      operacao.oncomplete = () => { 
        linkDB.close();
        resolve(true)}
      ;

      operacao.onerror = (e) => {
        linkDB.close();
        reject('Erro ao salvar no banco de dados:', e.target.error)
      };
    });
  },

  _definirGaveta(site) {
    const encontrado = this.gavetasOficiais.find(siteOficial => site.includes(siteOficial));
    return encontrado ? encontrado : this.novasGavetas[0]; // 1.7
  },
};

const BackgroundManager = {
  Validador: {
    string(val) { return typeof val === 'string' && val.trim() !== ''; },
    numero(val) { return typeof val === 'number' && !isNaN(val); },
    array(val) { return Array.isArray(val) && val.length > 0; },
    objeto(val) { return typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0; },
    booleano(val) { return typeof val === 'boolean'; },
  
    storageBuscar(val) { return this.string(val) || (this.array(val) && val.every(item => this.string(item))); },
    escopoStorage(val) { return val === 'global' || val === 'aba'; },  
    definido(val) { return val !== undefined && val !== null; }, // 3.0
  },

  async _limparLixoDaAba(tabId) {
    await StorageManager.executarSeguro('destruirGaveta', tabId); // 1.8
  },

  async _faxinaGeral() {
    const todoStorage = await chrome.storage.local.get(null);
    const KeysToDelet = Object.keys(todoStorage).filter(key => key.startsWith('aba_'));
    
    if (KeysToDelet.length > 0) {
      await chrome.storage.local.remove(KeysToDelet);
    }
  },

  _registrarOuvintesRelativos() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      for (const key in changes) {
        if (!key.startsWith('aba_')) continue;

        const tabId = parseInt(key.replace('aba_', ''));
        if (isNaN(tabId)) continue;

        const { newValue, oldValue } = changes[key];
        
        const estadoAtual = newValue?.estaCorrendo === true; // 2.0
        const estadoAntigo = oldValue?.estaCorrendo === true;

        if (estadoAtual !== estadoAntigo) {
          const mensagem = estadoAtual 
            ? { action: "INICIAR_TRADUCAO" }
            : { action: "PARAR_TRADUCAO" }

          chrome.tabs.sendMessage(tabId, mensagem).catch(() => {
            console.warn(`[Erro] A aba ${tabId} não está pronta para receber mensagens (sem content script).`);
          }); // 2.1 | 2.2
        }
      }
    });
  },

  async _chamadorFuncSegura (tabId, metodo, dados) { // 2.9
    const args = [metodo];

    if (tabId !== undefined && tabId !== null) args.push(tabId);
    if (dados !== undefined && dados !== null) args.push(dados); 

    const res = await StorageManager.executarSeguro(...args);
    console.log(res)
  },

  init() {
    chrome.runtime.onStartup.addListener(() => this._faxinaGeral()); // 1.9
    chrome.runtime.onInstalled.addListener(() => this._faxinaGeral());
    chrome.tabs.onRemoved.addListener((tabId) => this._limparLixoDaAba(tabId));

    this._registrarOuvintesRelativos();
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this._gerenciarMensagens(request, sender, sendResponse);
    });
  },

  _validarPayload(request, schema) {
    if (!schema) return null; // 2.5

    for (const [chave, tipo] of Object.entries(schema)) { // 2.6 | 2.7
      const valorRecebido = request[chave];
      const verificador = this.Validador[tipo]; // 3.1
      
      if (!verificador || !this.Validador[tipo](valorRecebido)) { // 3.2
        return `O parâmetro '${chave}' está ausente ou não é um '${tipo}' válido.`;
      }
    }

    return null;
  },

  _gerenciarMensagens(request, sender, sendResponse) {
    const requestCopy = {
      ...request,
      tabId: request.escopo === 'global' ? 'global' : sender.tab?.id
    }

    console.log(requestCopy)

    /* 
      =========================================================================
      DOCUMENTAÇÃO TÉCNICA: CONTRATO DE INTERFACE (SCHEMA)
      =========================================================================
       O 'schema' atua como um contrato de dados estrito. Propriedades declaradas
       são obrigatórias; propriedades omitidas são tratadas como opcionais.
       
       1. NOMENCLATURA: As chaves do schema devem ser idênticas às do request.
       2. OPCIONAIS: Para dados facultativos, omita a chave no schema.
       3. RIGIDEZ: Regras ativas (ex: 'objeto') bloqueiam null, {} ou arrays.
      ========================================================================= 
    */


    // EU ESTAVA AQUI TENTANDO RESOLVER A PARADA DE SE PRECISA DO ID OU E BUSCA GROBAL
    // E APOS RESOLVER E TESTAR ISSO TEM QUE IR LA NO STORAGE E PADRONIZAR O RETORNO. PQ
    // EU PESQUISIE ESTACORRENDO E O RESULTADO FOI FALSE, E O RETRY PESOU QUE A FUNCAO FAILHOU.
    
    const rotas = {
      "GERENCIAR_STORAGE_ABA": {
        isAsync: true,
        funcao: this._chamadorFuncSegura.bind(this), // 2.3
        schema: { 
          escopo: 'escopoStorage',
          metodo: 'string',
          dados: {
            salvar: 'objeto',
            buscar: 'storageBuscar',
          }[requestCopy.metodo] || 'definido',
        }, // 3.4
        argumentos: [ requestCopy.tabId, requestCopy.metodo, requestCopy.dados ], // 2.8
      },
    }

    const rota = rotas[requestCopy.action];

    if (!rota) {
      console.warn(`Ação desconhecida: ${requestCopy.action}`);
      return false;
    }

    const mensagemErro = this._validarPayload(requestCopy, rota.schema);

    if (mensagemErro) {
      console.error(`[Bloqueado] ${requestCopy.action} -> ${mensagemErro}`);
      sendResponse({ sucesso: false, dados:null, erro: mensagemErro });
      return false; 
    }

    if (rota.isAsync) {
      this._executorUniversal(rota.funcao, rota.argumentos, sendResponse);
      return true; // 2.8
    } else {
      const resultadoSincrono = rota.funcao(...rota.argumentos);
      sendResponse({ sucesso: true, dados: resultadoSincrono, erro:null }); 
      return false;
    }
  },

  async _executorUniversal(funcao, argumentos, sendResponse) {
    try {
      const resultado = await funcao(...argumentos);
      console.log('resultado:', resultado)
      sendResponse({ sucesso: true, dados: resultado, erro:null });
    } catch(e) {
      sendResponse({ sucesso: false, dados:null, erro: e.message });
    }
  },
}

BackgroundManager.init();

//let limite = true; //teste

// DEPOIS TRANSFORMAR ISSO EM UM MODULO PROCESSAR CAPITOLO OU ALGO PARECIDO.
// async function gerenciarProcessamento(request, tabId) {
//   const { site, capituloUrl } = request.dadosExtras;
//   const listaImagens = request.data; //Imgs so pra teste no final eu vou salvar o text e as cordenadas pro popup.
  
  // try {
    //const capituloSalvo = await Banco.buscar(site, capituloUrl);

    //por enquanto no futuro dentro dessa por um obj dentro assim;
    // { texto: jskjdsds, cordenadas:y67.. } meramente ilustrativo.
    //if (capituloSalvo) return capituloSalvo.paginas; DESATIVADO: Para testes do OCR.

    //organizar e entender isso.
    // if (limite) {
    //   limite = false
      
    //   const resultadodoAzure = await gerenciarOCR(listaImagens);
      
      // const dataUrl = JSON.stringify(resultadodoAzure); // Vamos passar via Storage ou URL

      // // Abre a página de preview da extensão
      // chrome.tabs.create({ url: 'preview.html' }, (tab) => {
      //   // Espera a página carregar e envia os dados
      //   setTimeout(() => {
      //     chrome.tabs.sendMessage(tab.id, { action: "RENDER_PREVIEW", data: resultadodoAzure });
      //   }, 1000);
      // });
      
    //}
    //  //beta isso vai ficar no backgroud
    //   _blobToBase64 (blob) {
    //     return new Promise((resolve, reject) => {
    //       const reader = new FileReader();
    //       reader.onloadend = () => resolve(reader.result);
    //       reader.onerror = reject;
    //       reader.readAsDataURL(blob);
    //     });
    //   },
  //beta
    //modelo de base para upar pro DB dps. fazer ajustes finos.
    // const capituloVirtual = {
    // versao: "1.0",
    // idCapitulo: "manga_xyz_cap_01", // Nome bonito para o ID
    // timestamp: Date.now(),
    // metadados: {
    //     titulo: "Nome do Mangá",
    //     numero: "01",
    //     totalLotes: resultadodoAzure.length
    // },
    // // Aqui entra o seu Array(7) que você mandou
    // lotes: resultadodoAzure 
    //};
//};



/*
  1.0 - objectStoreNames.contains() retorna true ou false.
  1.1 - Se for a primeira vez, ele cria as "gavetas".
  1.2 - link pra configurar.
  1.3 - link permanente.
  1.4 - readonly === leitura.
  1.5 - Nao funciona nativamente.
  1.6 - readwrite === escrita.
  1.7 - outros_sites".
  1.8 - ele dispara toda vez que um aba e fechada, mas n bug. e e mais barato assim do que verificar se existe.
  
  1.9 - Limpa todos os caches antigos ao iniciar o Chrome ou instalar/atualizar a extensão
  2.0 - O '=== true' garante que, se vier undefined, null ou texto, ele vira um 'false' limpo!
  2.1 - Esse metodo tabs o primeiro parametro e o ID da aba === endereco da copia do content, o segundo e a mesagem.
  2.2 - da pra usar o catch assim, mas so em funcoes que retornam promise.
  2.3 - O .bind() cria uma cópia da função, mas com o this "travado" no objeto que você escolher. serve para idependente de onde ela estiver 
        ela n perdera a referencia original, esta ai por causa do this
  2.4 - Para nao dar erro caso a propriedade venha undefied.
  2.5 - Sem regras? Passa direto.
  2.6 - O Object.entries pega esse objeto e transforma em uma lista (array) de pares, assim:
        const manga = { nome: "Naruto", caps: 700 };
        [
          ["nome", "Naruto"], // [chave, valor]
          ["caps", 700]       // [chave, valor]
        ]
  2.7 - Esses colchetes estao com essa funcao const 
        [primeira, segunda] = ["Maçã", "Banana"]; de atribuicao de variaveis e nao aquela de pegar um valor especifico usando o nome da chave
        O JS faz: primeira = "Maçã" e segunda = "Banana"
  2.8 - VITAL: Segura a linha pro Chrome esperar o await!
  2.9 - se nao for precisar de tabId ou dados tem que passar no schema o parametro como null, senao ele buga a ordem de insercao
  3.0 - Exige que você mande o dado. Só bloqueia se faltar (undefined) ou for null.
  3.1 - Se o 'tipo' não existir (ex: erro de digitação no schema) ele vai ser barrado entrando no if,
  3.2 - tenho que chama-lo assim invez de usar a variavel verificador pq tem metodos dentro do Validador que usam this, E apartir do momento
        que coloco a funcao dentro da vartivel ela perde o 'this'. 
*/