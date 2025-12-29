async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  
  //Para Evitar de pegar icones, logotipos ou banners.
  const pages = images
    .filter((img) => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450)
    .map(img => ({
      img,
      url: img.src
    }));
  console.log(pages)
  // if (pages.length > 0) {
  //   console.log(`Encontradas ${pages.length} possiveis paginas.`);

  //   const promises = pages.map((pages) => capturarImgemDaTela(pages.img, pages.url));
  //   const listaImgs = await Promise.all(promises);

  //   chrome.runtime.sendMessage({
  //     action: "PROCESSAR_CAPITOLO",
  //     dadosExtras: {
  //       site: window.location.hostname,
  //       titulo: document.title,
  //     },
  //     data: listaImgs
  //   });
  // };
};

window.addEventListener('load', () => {
  setTimeout(findMangaPages, 2000); //delay para garantir que as imgs via js carregaram.
});

function capturarImgemDaTela(imgElement, url) {
  return new Promise((resolve, reject) => {
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
      reject(new Error("A imagem ainda nao foi carregada ou esta quebrada"));
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
      reject('Erro ao converter imagem: ', e);
    };
  });
};