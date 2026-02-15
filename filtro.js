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
  } else {
    // Tenta comprimir. Se a função de comprimir falhar, mantém o original.

    // 1. Guarda o tamanho original para comparar depois
    const tamanhoOriginal = dataBlob.size;
    console.log(`%c[Original] ${(tamanhoOriginal / 1024).toFixed(2)} KB`, "color: orange; font-weight: bold;");

    dataBlob = (await ImageService.comprimirBlob(dataBlob)) || dataBlob;

    // 3. Calcula a economia
    const tamanhoFinal = dataBlob.size;
    const economia = (((tamanhoOriginal - tamanhoFinal) / tamanhoOriginal) * 100).toFixed(1);

    // 4. Mostra o resultado final com cor
    console.log(`%c[Comprimido] ${(tamanhoFinal / 1024).toFixed(2)} KB`, "color: #00ff00; font-weight: bold;");
    console.log(`%c[Economia] Reduziu ${economia}% do tamanho original`, "background: #222; color: #bada55; padding: 2px 5px;");
  };

  //Preciso refatorar 
  try {
    if (!dataBlob || dataBlob.size === 0) return { index, erro: "Blob vazio!" };

    const ExtensaoImg = dataBlob.type.split('/')[1]; //Eu separo em duas e depois pego a segunda.
    const extensoesSuportadas = ['jpg', 'jpeg', 'png',]; //por enquanto a api para extracao de texto n tem webp.

    let ehSuportada = extensoesSuportadas.includes(ExtensaoImg);
    
    if (!ehSuportada) return { index, erro: "Imagem não suportada" };

    const buffer = await dataBlob.arrayBuffer(); //Lembrando que depois de transformar nisso eu tenho que transformar em base64

    return { index, buffer, type: dataBlob.type };
  } catch(e) {
    return { index, erro: e.message };
  };
  //Preciso refatorar 
};

// FETCH
async function tentarFetch(entrada, estado) {
  if (entrada instanceof Blob) return entrada; // Se ja for um Blob, nao faz nada.

  try {
    const response = await fetch(entrada);

    if (!response.ok) {
      estado.erros++;
      return null
    };

    estado.erros = 0;
    return await response.blob();

  } catch (e) {
    estado.erros++;
    return null;
  };
};

  //Preciso refatorar - Colocar dentro de ImageService.
async function capturarImgemDaTela(imgElement, url) {
  if (!imgElement.complete || imgElement.naturalWidth === 0) {
    return { sucesso: false, erro: "Imagem quebrada" };
  };
  
  try {
    //Usar a funcao ultilitaria dps
    const canvas = ImageService.criarCanvasDaimg(imgElement);

    const blobGerado = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

    if(!blobGerado) return { url, sucesso: false, erro: "Falha ao gerar blob" };

    return { blob: blobGerado, url, sucesso: true };
  } catch (e){
    return { url, sucesso: false, erro: e.message};
  };
};
 //Preciso refatorar 

const ImageService = {
  criarCanvasDaimg(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  },

  async comprimirBlob(input) {
    if (!(input instanceof Blob)) return false;

    return new Promise((resolv) => {
      const img = new Image();

      img.onload = () => { // So executa quando a img carregar na memoria.
        try {
          const canvas = this.criarCanvasDaimg(img);
          canvas.toBlob((blob) => { //1
            URL.revokeObjectURL(img.src); // Limpa da memoria RAM.
            resolv(blob || false);
          }, 'image/jpeg', 0.9);

        } catch (e) {
          URL.revokeObjectURL(img.src);
          resolv(false);
        };
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src); 
        resolv(false);
      };

      img.src = URL.createObjectURL(input); // Cria um link pros dados do blob.
    });
  },
};

/*
  1 - Espera a imagem carregar na memoria RAM, tira um "print" dela no canvas, depois transforma em um blob comprimido 
      e só depois apaga o link temporário depois que o novo arquivo estiver pronto.
*/