import { gerenciarOCR } from "./ocr_service.js";
import StorageManager from "./storageManager.js";

const BackgroundManager = {
  async _limparLixoDaAba(tabId) {
    await StorageManager.destruirGaveta(tabId);// 2.1
  },

  init() {
    chrome.tabs.onRemoved.addListener((tabId) => {
      this._limparLixoDaAba(tabId);
    });
  }
}

BackgroundManager.init();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action ===  "PROCESSAR_CAPITOLO") gerenciarProcessamento(request, sender.tab.id);
});

const Banco = {
  // LISTA PRINCIPAL: Adicione novos sites de Leitura grandes aqui.
  gavetasOficiais: ["mangaplus.shueisha.co.jp", "mangadex.org"],
  novasGavetas: ["outros_sites"],

  criarGavetas(linkDB) {
    const todasAsGavetas = [ ...this.gavetasOficiais, ...this.novasGavetas ];
    
    todasAsGavetas.forEach(site => {
      if (!linkDB.objectStoreNames.contains(site)) {  // 1.3
        linkDB.createObjectStore(site, { keyPath: "capituloUrl" });
      };
    });
  },

  async conectar() {
    return new Promise((resolve, reject) => { 
      const pedido = indexedDB.open("MangaCache", 1); //1 

      pedido.onupgradeneeded = (e) => { // 1.4
        const linkDB = e.target.result; // 1.5 

        // DELETAR GAVETAS.
        // if (linkDB.objectStoreNames.contains("nome da gaveta")) {
        //   linkDB.deleteObjectStore("nome da gaveta");
        // };

        this.criarGavetas(linkDB);
      };

      pedido.onsuccess = () => resolve(pedido.result); // 1.6
      pedido.onerror = (e) => reject("Erro fatal ao abrir o banco:", e.target.error);
    });
  },

  async buscar(site, url) {
    const linkDB = await this.conectar();
    const gavetaNome = this._definirGaveta(site);
    
    return new Promise((resolve) => {
      const operacao = linkDB.transaction([gavetaNome], "readonly"); // 1.7
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
    
    return new Promise((resolve, reject) => { // 1.8
      const operacao = linkDB.transaction([gavetaNome], "readwrite");// 1.9
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
    return encontrado ? encontrado : this.novasGavetas[0]; // 2.0
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
  1.3 - objectStoreNames.contains() retorna true ou false.
  1.4 - Se for a primeira vez, ele cria as "gavetas".
  1.5 - link pra configurar.
  1.6 - link permanente.
  1.7 - readonly === leitura.
  1.8 - Nao funciona nativamente.
  1.9 - readwrite === escrita.
  2.0 - outros_sites".
  2.1 - ele dispara toda vez que um aba e fechada, mas n bug. e e mais barato assim do que verificar se existe.
  1 - qualquer altercao na estrutura do banco ou deletar gavetas; exije a mudanca do valor, ou apagar o cache (F12 em Application).
*/