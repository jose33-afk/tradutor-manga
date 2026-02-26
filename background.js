import { gerenciarOCR } from "./ocr_service.js";

const PosInstalacaoExtensao = {
  variaveisBase: {
    estaCorrendo: false,
    idiomaOrigem: "en",
    idiomaConfig: "pt",
    ultimaUrl: null
  },

  async configurarPrimeiroUso() {
    const bancoInteiro = await chrome.storage.local.get(null); // 1.1
    if (Object.keys(bancoInteiro).length === 0) { //1.2
      console.log("🌱 Primeira instalação! Criando variáveis essenciais...");
      await chrome.storage.local.set(this.variaveisBase);
    }
  },
}

// ajeitar isso
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // O changeInfo.url só existe se a URL da aba realmente mudou
  if (changeInfo.url) {
    try {
      // Puxa os dados do banco
      const dados = await StorageManager.buscar(['estaCorrendo', 'ultimaUrl']);

      // Se a extensão estiver LIGADA e a URL nova for diferente da salva...
      if (dados.estaCorrendo && dados.ultimaUrl && tab.url !== dados.ultimaUrl) {
        console.log("🛑 Mudança de URL detectada pelo Background! Desligando a extensão...");
        
        // Reseta o banco de dados para o padrão (Desliga tudo)
        await StorageManager.salvar(StorageManager.variaveisBase);
        
        // BÔNUS: Se você quiser, pode injetar um aviso visual na tela ou só deixar desligar silenciosamente
      }
    } catch (erro) {
      console.error("Erro no vigia do background:", erro);
    }
  }
});
// ajeitar isso

chrome.runtime.onInstalled.addListener(() => {
  PosInstalacaoExtensao.configurarPrimeiroUso();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action ===  "PROCESSAR_CAPITOLO") gerenciarProcessamento(request, sender.tab.id);
});

const Banco = {
  // LISTA PRINCIPAL: Adicione novos sites de Leitura grandes aqui.
  gavetasOficiais: ["mangaplus.shueisha.co.jp", "mangadex.org"],
  novasGavetas: ["outros_sites"],

  criarGavetas(linkDB) {
    const todasAsGavetas = [ ...this.gavetasOficiais, ...this.novasGavetas ];
    
    //objectStoreNames.contains() retorna true ou false.
    todasAsGavetas.forEach(site => {
      if (!linkDB.objectStoreNames.contains(site)) { 
        linkDB.createObjectStore(site, { keyPath: "capituloUrl" });
      };
    });
  },

  async conectar() {
    return new Promise((resolve, reject) => { 
      const pedido = indexedDB.open("MangaCache", 1); //1 

      // Se for a primeira vez, ele cria as "gavetas".
      pedido.onupgradeneeded = (e) => {
        const linkDB = e.target.result; // link pra configurar.

        // DELETAR GAVETAS.
        // if (linkDB.objectStoreNames.contains("nome da gaveta")) {
        //   linkDB.deleteObjectStore("nome da gaveta");
        // };

        this.criarGavetas(linkDB);
      };

      pedido.onsuccess = () => resolve(pedido.result); // link permanente.
      pedido.onerror = (e) => reject("Erro fatal ao abrir o banco:", e.target.error);
    });
  },

  async buscar(site, url) {
    const linkDB = await this.conectar();
    const gavetaNome = this._definirGaveta(site);
    
    return new Promise((resolve) => {
      const operacao = linkDB.transaction([gavetaNome], "readonly");// readonly === leitura.
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
    
    return new Promise((resolve, reject) => { // Nao funciona nativamente.
      const operacao = linkDB.transaction([gavetaNome], "readwrite");// readwrite === escrita.
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
    return encontrado ? encontrado : this.novasGavetas[0]; // "outros_sites".
  },
};

let limite = true; //teste

async function gerenciarProcessamento(request, tabId) {
  const { site, capituloUrl } = request.dadosExtras;
  const listaImagens = request.data; //Imgs so pra teste no final eu vou salvar o text e as cordenadas pro popup.
  
  // try {
    //const capituloSalvo = await Banco.buscar(site, capituloUrl);

    //por enquanto no futuro dentro dessa por um obj dentro assim;
    // { texto: jskjdsds, cordenadas:y67.. } meramente ilustrativo.
    //if (capituloSalvo) return capituloSalvo.paginas; DESATIVADO: Para testes do OCR.

    //organizar e entender isso.
    if (limite) {
      limite = false
      
      const resultadodoAzure = await gerenciarOCR(listaImagens);
      
      // const dataUrl = JSON.stringify(resultadodoAzure); // Vamos passar via Storage ou URL

      // // Abre a página de preview da extensão
      // chrome.tabs.create({ url: 'preview.html' }, (tab) => {
      //   // Espera a página carregar e envia os dados
      //   setTimeout(() => {
      //     chrome.tabs.sendMessage(tab.id, { action: "RENDER_PREVIEW", data: resultadodoAzure });
      //   }, 1000);
      // });
      
    }
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
};



/*
  1.1 - get(null) = "Me traga TUDO que tem no banco" para verificar se as variaveis ja existem ou precisa cria-las.
  1.2 - pega o seu objeto e extrai todas as chaves dele, transformando-as em um Array (uma lista). E como a gente sabe, Arrays possuem a propriedade .length!
  1 - qualquer altercao na estrutura do banco ou deletar gavetas; exije a mudanca do valor, ou apagar o cache (F12 em Application).
*/