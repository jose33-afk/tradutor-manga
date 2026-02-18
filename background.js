import { gerenciarOCR } from "./ocr_service.js";

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

    if (limite) {
      limite = false
      
      const resultadodoAzure = await gerenciarOCR(listaImagens);
      
      // if (tabId) {
      //   chrome.tabs.sendMessage(tabId, {
      //     action: "DESENHAR_POPUP",
      //     data: resultadodoAzure
      //   });
      //   console.log("Mensagem de volta enviada para a aba:", tabId);
      // }
    }
   
  //   // AGUARDANDO A PARTE DO OCR...
  //   // const capituloParaSalvar = {
  //   //   capituloUrl: capituloUrl,
  //   //   paginas: imagensBrutas, 
  //   //   data: new Date().toISOString()
  //   // };

  //   // await Banco.salvar(site, capituloParaSalvar);
  // } catch (e) {
  //   console.error("ERRO no fluxo do banco:", e);
  //   return null;
  // };
};



/*
  1 - qualquer altercao na estrutura do banco ou deletar gavetas; exije a mudanca do valor, ou apagar o cache (F12 em Application).
*/