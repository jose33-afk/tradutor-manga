async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  
  //Para Evitar de pegar icones, logotipos ou banners.
  const urls = images
    .filter((img) => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450)
    .map(img => img.src);

  if (urls.length > 0) {
    console.log(`Encontradas ${urls.length} possiveis paginas.`);
    
    const urlDoFiltro = chrome.runtime.getURL('filtro.js');
    const modulo = await import(urlDoFiltro);
    
    //O promise.all serve para ele esperar todas as promises serem prontas.
    let imgPosfiltro = await Promise.all(urls.map((url) => modulo.filtroImg(url)));
    console.log(imgPosfiltro)

    //O FILTRO NO MANGA PLUS N VAI FUNCINAR EU TENHO QUE IMPLENTAR O MODO ANTIGO 
    //NESSES TIPOS DE SITE.

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

//Metodo antigo - Fazer uma print com canvas.
// function capturarImgemDaTela(imgElement, url) {
//   return new Promise((resolve, reject) => {
//     if (!imgElement.complete || imgElement.naturalWidth === 0) {
//       reject(new Error("A imagem ainda nao foi carregada ou esta quebrada"));
//       return;
//     }

//     try {
//       const canvas = document.createElement('canvas');
//       canvas.width = imgElement.naturalWidth;
//       canvas.height = imgElement.naturalHeight;

//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(imgElement, 0, 0);
      
//       const dataUrl = canvas.toDataURL('image/jpeg', 0.8);//Converte para Base64
//       resolve({img: dataUrl, url});
//     } catch (e){
//       reject('Erro ao converter imagem: ', e);
//     };
//   });
// };