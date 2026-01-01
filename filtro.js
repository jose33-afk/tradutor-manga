export async function filtroImg(element, url) { //sim n da para usar import mas precisa do export
  let response;

  try {
    response = await fetch(url);
  } catch (e) {
    response = await capturarImgemDaTela(element, url);
    
    if(!response.sucesso) return;
    response = response.blob;
  };

  try {
    let dataBlob;

    if (response instanceof Blob) dataBlob = response;
    else dataBlob = await response.blob();

    console.log(dataBlob)
    // if (dataBlob.size === 0 || !dataBlob.type.includes('image')) {
    //   console.log('Arquivo ignorado: Nao e uma imagem valida ou esta vazio.', dataBlob, 'url:', url);
    //   return;
    // };

    // const ExtensaoImg = dataBlob.type.split('/')[1]; //Eu separo em duas e depois pego a segunda.
    // const extensoesSuportadas = ['jpg', 'jpeg', 'png', 'webp'];
    // let ehSuportada;

    // ehSuportada = extensoesSuportadas.some(ext => ExtensaoImg === ext); //O some e ao contrario.

    // if (!ehSuportada) {
    //   console.log(`Nao podemos proseguir com a img:${url} url nao suportada: ${ExtensaoImg}`);
    //   return;
    // };

    // return { blob: dataBlob, url };
  } catch(e) {
    console.error('Erro ao buscar os dados do blob:', e);
    return;
  };
};

function capturarImgemDaTela(imgElement, url) {
  return new Promise((resolve, reject) => {
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
      resolve(new Error("A imagem ainda nao foi carregada ou esta quebrada"));
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);

      canvas.toBlob((blobGerado) => {
        if (blobGerado) resolve( { blob: blobGerado, url, sucesso:true} );
        else resolve({ sucesso: false });
      });
    } catch (e){
      console.warn('Erro ao converter uma imagem específica:', e);
      resolve({ blob: imgElement, url, sucesso:false });
    };
  });
};
