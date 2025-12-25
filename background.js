const requestDB = indexedDB.open('MangaCache', 1); //abre um arquivo no HD do usuario.
let db; //Para outras funcoes.

//Se a gaveta nunca existiu (primeira vez que usa), o Chrome cria o "formato" dela
requestDB.onupgradeneeded = (event) => {
  const dbConfig = event.target.result;
  if (!dbConfig.objectStoreNames.contains("paginas")) {
    // Criamos a gaveta e já grudamos o índice nela na mesma sequência
    dbConfig.createObjectStore("paginas", { keyPath: "id", autoIncrement: true })
            .createIndex("urlIndex", "url", { unique: true });
  };
};

requestDB.onsuccess = (event) => {
  db = event.target.result;
  console.log("Banco pronto!");
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PROCESSAR_CAPITOLO") {
    console.log('Iniciando download das imagens...');
    processarImagens(request.data); //Funcao assincrona para n travar o navegador.
  };
});

async function processarImagens(urls) {
  for (let url of urls) {
    try {
      //Ler e verificar se existe.
      const transicao = db.transaction(["paginas"], "readwrite"); //["nome da gaveta"] | readwrite == nivel de acesso
      const gaveta = transicao.objectStore("paginas"); //Aqui eu entro de fato, antes estava pedindo permissao.
      const indice = gaveta.index('urlIndex'); //catalogo de urls
      const consulta = indice.get(url); 

      consulta.onsuccess = async () => {
        if(consulta.result) {
          console.log(`A pagina ja esta no cache (ID: ${consulta.result.id})`);

        } else {
          console.log("Imagem nova detectada. Baixando..."); 

          const resposta = await fetch(url);
          const imagemBlob = await resposta.blob(); //converte os dados recebidos em um obj de imagem binaria. 
          const transacaoGravacao = db.transaction(["paginas"], "readwrite");
          const gavetaGravacao = transacaoGravacao.objectStore("paginas");
          
          gavetaGravacao.put({
            url,
            dados: imagemBlob,
            data: new Date()
          });
          console.log(`Sucesso! Salva no banco`);
        };
      };
    } catch (error) {
      console.error('Erro ao baixar a imgem da URL:', url, error);
    };
  };
};