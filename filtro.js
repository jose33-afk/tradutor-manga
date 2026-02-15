export async function filtroImg(element, url, index, estado) { // 1.1 
  const LIMITE_ERROS = 4;
  let dataBlob;
  
  if (estado.erros < LIMITE_ERROS) dataBlob = await tentarFetch(url, estado); // 1.2

  if (!dataBlob) {
    let response = await ImageService.capturarImgemDaTela(element);
    if (!response) return null; // 1.3
    dataBlob = response;
  } else {
    dataBlob = (await ImageService.comprimirBlob(dataBlob)) || dataBlob; // 1.4
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
    const res = await fetch(entrada);
    if (!res.ok) throw new Error();
    
    estado.erros = 0;
    return await res.blob();
  } catch (e) {
    estado.erros++;
    return null;
  };
};


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

  async capturarImgemDaTela(imgElement) {
    if (!imgElement.complete || imgElement.naturalWidth === 0) return null;
    try {
      const canvas = this.criarCanvasDaimg(imgElement);
      const blobGerado = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9)); 
      return blobGerado || null;
    } catch (e) {
      return null;
    };
  },
};

/*
  1.1 - O IMPORT normal nao funciona, mas o EXPORT e necessario.
  1.2 - Tenta o fetch; se der falha (CORS ou erro de rede), cai no canvas.
  1.3 - index e para saber quais imagens falharam.
  1.4 - Tenta comprimir. Se a função de comprimir falhar, mantém o original.

  1 - Espera a imagem carregar na memoria RAM, tira um "print" dela no canvas, depois transforma em um blob comprimido 
      e só depois apaga o link temporário depois que o novo arquivo estiver pronto.
*/