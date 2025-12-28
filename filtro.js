async function filtroImg(url) {
  let urlLimpa = await url.split('?')[0].toLowerCase();
  const extensoesSuportadas = ['.jpg', '.jpeg', '.png', '.webp'];
  const ehSuportada = extensoesSuportadas.some(ext => urlLimpa.endsWith(ext)); //forma bem util.

  if (!ehSuportada) {
    console.log('Formato n suportado:', url ,'pulando..');
    return false;
  };

  const origin = new URL(url).host;
  console.log(origin)

  


  // const resposta = await fetch(url);
  // const imagemBlob = await resposta.blob(); //converte os dados recebidos em um obj de imagem binaria. 

  // if (imagemBlob.size === 0 || !imagemBlob.type.includes('image')) {
  //   console.log('Arquivo ignorado: Nao e uma imagem valida ou esta vazio.', imagemBlob, 'url:', url);
  //   return;
  // };
};