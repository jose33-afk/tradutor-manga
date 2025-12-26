importScripts('config.js', 'ocr_service.js');
const requestDB = indexedDB.open('MangaCache', 1); //abre um arquivo no HD do usuario.
let db; //Para outras funcoes.
let filaDeTraducao = [];
let processandoFila = false;

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
      const acesso = db.transaction(["paginas"], "readwrite"); //["nome da gaveta"] | readwrite == nivel de acesso
      const gaveta = acesso.objectStore("paginas"); //Aqui eu entro de fato, antes estava pedindo permissao.
      const indice = gaveta.index('urlIndex'); //catalogo de urls
      const consulta = indice.get(url); 

      consulta.onsuccess = async () => {
        if(consulta.result) {
          console.log(`A pagina ja esta no cache (ID: ${consulta.result.id})`);
        } else {
          console.log("Imagem nova detectada. Baixando..."); 

          const resposta = await fetch(url);
          const imagemBlob = await resposta.blob(); //converte os dados recebidos em um obj de imagem binaria. \

          const transacaoGravacao = db.transaction(["paginas"], "readwrite");
          const gavetaGravacao = transacaoGravacao.objectStore("paginas");
          
          const pedindoPut = gavetaGravacao.put({
            url,
            dados: imagemBlob,
            data: new Date()
          });
          
          pedindoPut.onsuccess = () => {
            if (url.endsWith(".svg") || url.includes("mascot") || url.includes("cta/")) {
              console.log("Ignorando imagem irrelevante para OCR:", url);
              return; 
            }

            console.log(`Salvo: ${url}. Adicionando a fila de OCR..`);
            filaDeTraducao.push(url);
            processarProximoDaFila();
          };
        };
      };
    } catch (error) {
      console.error('Erro ao baixar a imgem da URL:', url, error);
    };
  };
};

async function processarProximoDaFila() {
  if(processandoFila || filaDeTraducao.length === 0) return;

  processandoFila = true;
  const urlAtual = filaDeTraducao.shift();
  
  try {
    console.log(`[FILA] Processando OCR agora: ${urlAtual}`);
    const textoGringo = await extrairText(urlAtual, db);
    console.log(`[FILA] Texto extraido na URL ${urlAtual}:`, textoGringo);

  } catch (e) {
    console.log(`[FILA] Falhou na URL ${urlAtual}:`, e);
  } finally {
    processandoFila = false;
    processarProximoDaFila(); //proximo da lista se houver.
  };

};