export async function filtroImg(element, url, index, estado, posicoes) { // 1.1 
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

  try {
    const EXTENSOES_PERMITIDAS = ['image/jpg', 'image/jpeg', 'image/png'];

    if(!dataBlob?.size) return { index, erro: "Blob vazio!" };
    if (!EXTENSOES_PERMITIDAS.includes(dataBlob.type)) return { index, erro: "Imagem não suportada" };

    const imageDataUrl = await ImageService.blobToBase64(dataBlob);

    return { index, imageDataUrl, type: dataBlob.type, posicoes };
  } catch(e) {
    return { index, erro: e.message };
  };
};

async function tentarFetch(entrada, estado) {
  if (entrada instanceof Blob) return entrada; // 1.5

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

      img.onload = () => { // 1.6
        try {
          const canvas = this.criarCanvasDaimg(img);
          canvas.toBlob((blob) => { // 1
            URL.revokeObjectURL(img.src); // 1.7
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

      img.src = URL.createObjectURL(input); // 1.8
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

  async blobToBase64(blob) {
    return new Promise((resolv) => {
      const reader = new FileReader();
      reader.onloadend = () => resolv(reader.result);
      reader.onerror = () => resolv(null);
      reader.readAsDataURL(blob);
    });
  },
};

/*depois 
  1.1 - O IMPORT normal nao funciona, mas o EXPORT e necessario.
  1.2 - Tenta o fetch; se der falha (CORS ou erro de rede), cai no canvas.
  1.3 - index e para saber quais imagens falharam.
  1.4 - Tenta comprimir. Se a função de comprimir falhar, mantém o original.
  1.5 - Se ja for um Blob, nao faz nada.
  1.6 - So executa quando a img carregar na memoria.
  1.7 - Limpa da memoria RAM.
  1.8 Cria um link pros dados do blob.

  1 - Espera a imagem carregar na memoria RAM, tira um "print" dela no canvas, depois transforma em um blob comprimido 
      e só depois apaga o link temporário depois que o novo arquivo estiver pronto.
*/