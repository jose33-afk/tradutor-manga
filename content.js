async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  
  //Para Evitar de pegar icones, logotipos ou banners.
  const imgsFiltradas = images
    .filter((img) => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450)
    .map(img => img);

  if (imgsFiltradas.length > 0) {
    console.log(`Encontradas ${imgsFiltradas.length} possiveis paginas.`);

    const caminhoDoFiltro = chrome.runtime.getURL('filtro.js');
    const modulo = await import(caminhoDoFiltro);
    
    //O promise.all serve para ele esperar todas as promises serem prontas.
    let imgPosfiltro = await Promise.all(imgsFiltradas.map((element) => modulo.filtroImg(element, element.src)));
    console.log(imgPosfiltro)
    // const falhou = imgPosfiltro.includes(undefined);
    //TENHO QUE FAZER UMA FORMA PARA VER SE TODAS AS PAGINAS FORAM CARREGADAS
    //MINHA PRIMEIRA TENTATIVA E FAZENDO UM ID PARA CADA IMG E DEPOIS CONFERIR SE 
    //TODAS FORAM CARREGADAS.

    // if (falhou) {
    //   console.log('Ocorreu um erro ao pegar as imagens, seguindo para o canvas... ', imgPosfiltro);
    //   imgPosfiltro.length = 0;
    //   imgPosfiltro = await Promise.all(images.map(element => capturarImgemDaTela(element, element.src)));
    //   console.log(imgPosfiltro)
    // };

    //console.log(imgPosfiltro)

    //O FILTRO NO MANGA PLUS N VAI FUNCINAR EU TENHO QUE IMPLENTAR O MODO ANTIGO 
    //NESSES TIPOS DE SITE.

    //Vou ter que fazer try com fech se der erro eu rodo o canvas.

    // console.log(imgPosfiltro)
    // chrome.runtime.sendMessage({
    //   action: "PROCESSAR_CAPITOLO",
    //   dadosExtras: {
    //     site: window.location.hostname,
    //     titulo: document.title,
    //   },
    //   data: urls
    // });
 };
};

window.addEventListener('load', () => {
  setTimeout(findMangaPages, 2000); //delay para garantir que as imgs via js carregaram.
});

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
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);//Converte para Base64
      resolve({img: dataUrl, url});
    } catch (e){
      console.warn('Erro ao converter uma imagem específica:', e);
      resolve(imgElement);
    };
  });
};