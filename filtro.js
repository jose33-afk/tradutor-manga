export async function filtroImg(url) { //sim n da para usar import mas precisa do export
  try {
    //console.log(url) teste
    //console.log(url.slice(0, 4)) teste
    const response = await fetch(url);
    const dataBlob = await response.blob();

    if (dataBlob.size === 0 || !dataBlob.type.includes('image')) {
      console.log('Arquivo ignorado: Nao e uma imagem valida ou esta vazio.', dataBlob, 'url:', url);
      return;
    };

    const ExtensaoImg = dataBlob.type.split('/')[1]; //Eu separo em duas e depois pego a segunda.
    const extensoesSuportadas = ['jpg', 'jpeg', 'png', 'webp'];
    let ehSuportada;

    ehSuportada = extensoesSuportadas.some(ext => ExtensaoImg === ext); //O some e ao contrario.

    if (!ehSuportada) {
      console.log(`Nao podemos proseguir com a img:${url} url nao suportada: ${ExtensaoImg}`);
      return ;
    };

    //if (ExtensaoImg = 'webp') dataBlob = converterWebp(dataBlob);

    return { blob: dataBlob, url };
  } catch(e) {
    console.error('Erro ao buscar os dados do blob:', e);
    return;
  };
};


// async function converterWebp(blobWebp) {
//   return new Promise((resolve, reject) => {
//     const url = URL.createObjectURL(blobWebp);
//     console.log(url)
//   });
// };
