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
        if (!linkDB.objectStoreNames.contains("mangaplus.shueisha.co.jp")) { // Gaveta exclusiva MangaPlus.
          linkDB.createObjectStore("mangaplus.shueisha.co.jp", { keyPath: "capituloUrl" });
        };

        if (!linkDB.objectStoreNames.contains("mangadex.org")) { // Gaveta exclusiva MangaDex.
          linkDB.createObjectStore("mangadex.org", { keyPath: "capituloUrl" });
        };

        if (!linkDB.objectStoreNames.contains("outros_sites")) { // Gaveta sites menores.
          linkDB.createObjectStore("outros_sites", { keyPath: "capituloUrl" });
        }
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