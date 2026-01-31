export async function filtroImg(element, url, index, estado) { // O IMPORT normal nao funciona, mas o EXPORT e necessario.
  const LIMITE_ERROS = 4;
  let dataBlob;
 
  // Tenta o fetch; se der falha (CORS ou erro de rede), cai no canvas.
  if (estado.erros < LIMITE_ERROS) dataBlob = await tentarFetch(url, estado); 

  if (!dataBlob) {
    let response = await capturarImgemDaTela(element, url);

    if (!response.sucesso) {
      return { index, erro: response.erro }; //O index e para saber quais imagens falharam.
    };
    dataBlob = response.blob;
  };

  try {
    if (!dataBlob || dataBlob.size === 0) return { index, erro: "Blob vazio!" };

    const ExtensaoImg = dataBlob.type.split('/')[1]; //Eu separo em duas e depois pego a segunda.
    const extensoesSuportadas = ['jpg', 'jpeg', 'png',]; //por enquanto a api para extracao de texto n tem webp.

    let ehSuportada = extensoesSuportadas.includes(ExtensaoImg);
    
    if (!ehSuportada) return { index, erro: "Imagem não suportada" };

    return { index, blob: dataBlob, url };
  } catch(e) {
    return { index, erro: e.message };
  };
};

async function tentarFetch(entrada, estado) {
  if (entrada instanceof Blob) return entrada; // Se ja for um Blob, nao faz nada.

  try {
    const response = await fetch(entrada);

    if (!response.ok) {
      estado.erros++;
      return null
    };

    estado.erros = 0;
    return response instanceof Blob ? response : await response.blob();

  } catch (e) {
    estado.erros++;
    return null;
  };
};

async function capturarImgemDaTela(imgElement, url) {
  if (!imgElement.complete || imgElement.naturalWidth === 0) {
    return { sucesso: false, erro: "Imagem quebrada" };
  };
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);

    const blobGerado = await new Promise(resolve => canvas.toBlob(resolve));

    if(!blobGerado) return { url, sucesso: false, erro: "Falha ao gerar blob" };

    return { blob: blobGerado, url, sucesso: true };
  } catch (e){
    return { url, sucesso: false, erro: e.message};
  };
};
