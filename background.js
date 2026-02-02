chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action ===  "PROCESSAR_CAPITOLO") gerenciarProcessamento(request);
});

const Banco = {
  async conectar() {
    return new Promise((resolve, reject) => {
      const pedido = indexedDB.open("MangaCache", 3);

      // Se for a primeira vez, ele cria as "gavetas".
      pedido.onupgradeneeded = (e) => {
        const linkDB = e.target.result; // link pra configurar.

        // objectStoreNames.contains() retorna true ou false.
        const sites = ["mangaplus.shueisha.co.jp", "mangadex.org", "outros_sites"];
        sites.forEach(site => {
          if (!linkDB.objectStoreNames.contains(site)) { 
            linkDB.createObjectStore(site, { keyPath: "capituloUrl" });
          };
        });
      };

      pedido.onsuccess = () => {
        console.log("Conectado ao banco...");
        resolve(pedido.result)
      }; // link permanente.

      pedido.onerror = (e) => {
        console.error("Erro fatal ao abrir o banco:", e.target.error);
        reject("Não consegui abrir o armário de mangás!");
      };
    });
  },
}

async function gerenciarProcessamento(request) {
  const { site, capituloUrl } = request.dadosExtras;
  const listaImagens = request.data;
  const db = await Banco.conectar(); //testes
  console.log(db);
  console.log("Gavetas encontradas:", db.objectStoreNames);// testes

 
};