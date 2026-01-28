export async function filtroImg(element, url, index, estado) { //sim n da para usar import mas precisa do export
  const LIMITE_ERROS = 4;
  let dataBlob;
  console.log('Erros', estado.erros)
  // Tenta o fetch; se der falha (CORS ou erro de rede), cai no canvas.
  if (estado.erros < LIMITE_ERROS) dataBlob = await tentarFetch(url, estado, LIMITE_ERROS); 

  if (!dataBlob) {
    let response = await capturarImgemDaTela(element, url);

    if (!response.sucesso) {
      return { index, erro: response.erro }; //O index e para saber quais imagens falharam.
    };
    console.log('passou por aqui')
    dataBlob = response.blob;
  };

  try {
    // ANTES DE TUDO VAMOS CRIAR UM ARQUIVO HTML PRA TESTAR NO MANGA PLUS. O MANGA DEX N TA PEGANDO  TODAS AS IMG 
    if (dataBlob instanceof Blob) {
      // 1. Cria a URL temporária para o navegador conseguir ler o binário
      const urlTemporaria = URL.createObjectURL(dataBlob);

      // 2. Cria um elemento de imagem para o teste
      const debugImg = document.createElement('img');
      debugImg.src = urlTemporaria;
      
      // Estiliza para não bagunçar o site original (fica pequeno no canto)
      debugImg.style.cssText = `
          width: 150px; 
          border: 2px solid red; 
          margin: 5px;
          position: relative;
          z-index: 999999;
      `;

      // 3. Joga no final do body para você conferir
      document.body.appendChild(debugImg);

      console.log("Visualização da página adicionada ao final do site.");
    }
    
    if (!dataBlob || dataBlob.size === 0) return { index, erro: "Blob vazio!" };


    const ExtensaoImg = dataBlob.type.split('/')[1]; //Eu separo em duas e depois pego a segunda.
    const extensoesSuportadas = ['jpg', 'jpeg', 'png', 'webp']; //por enquanto a api para extracao de texto n tem webp.

    let ehSuportada = extensoesSuportadas.includes(ExtensaoImg);
    
    if (!ehSuportada) return { index, erro: "Imagem não suportada" };

    
    console.log(ExtensaoImg)
    return { index, blob: dataBlob, url };
  } catch(e) {
    return;
  };
};

async function tentarFetch(entrada, estado, limite) {
  if (entrada instanceof Blob) return entrada; // Se ja for um Blob, nao faz nada.
  if(estado.erros >= limite) return null;

  console.log('Erros dentro', estado.erros)
  // Se for uma URL.
  try {
    const response = await fetch(entrada);

    if (!response.ok) {
      console.log('response erro')
      estado.erros++;
      console.log('erros apos response falhar', estado.erros)
      return null
    };

    estado.erros = 0;
    return response instanceof Blob ? response : await response.blob();
  } catch (e) {
    console.log('no catch')
    estado.erros++;
    console.log('no catch erros', estado.erros)
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
