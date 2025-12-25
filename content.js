function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  
  //Para Evitar de pegar icones, logotipos ou banners.
  const pages = images.filter((img) => img.naturalWidth > 500 || img.width > 500);
  
  if (pages.length > 0) {
    console.log(`Encontradas ${pages.length} possiveis paginas.`);

    const urls = pages.map(img => img.src);
    
    chrome.runtime.sendMessage({
      action: "PROCESSAR_CAPITOLO",
      dadosExtras: {
        site: window.location.hostname,
        titulo: document.title,
      },
      data: urls
    });
  };
};

window.addEventListener('load', () => {
  setTimeout(findMangaPages, 2000); //delay para garantir que as imgs via js carregaram.
});
