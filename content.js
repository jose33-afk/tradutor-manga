function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  
  //Para Evitar de pegar icones, logotipos ou banners.
  const pages = images.filter((img) => img.naturalWidth > 500 || img.width > 500);
  
  if (pages.length > 0) {
    console.log(`Encontradas ${pages.length} possiveis paginas.`);

    copyImgs = pages.map((img) => capturarImgemDaTela(img));
    console.log(copyImgs)
    // const urls = pages.map(img => img.src);
    
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

function capturarImgemDaTela(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    } catch (e){
      reject('Erro ao converter imagem: ', e);
    };
  });
};