async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
  console.log(images)
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
    //Fazer a pagina rolar ate em baixo e quando carregar voltar pro topo.

    // if (falhou) {
    //   console.log('Ocorreu um erro ao pegar as imagens, seguindo para o canvas... ', imgPosfiltro);
    //   imgPosfiltro.length = 0;
    //   imgPosfiltro = await Promise.all(images.map(element => capturarImgemDaTela(element, element.src)));
    //   console.log(imgPosfiltro)
    // };

    //console.log(imgPosfiltro)

  

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
  setTimeout(() => encrontrarElementoDeScroll('img'), 5000)
  
  //setTimeout(() => findMangaPages(), 5000); //delay para garantir que as imgs via js carregaram.
});


function encrontrarElementoDeScroll(seletor) {
  const html = document.documentElement; //para funcionar em qualquer navegador.
  const body = document.body;
  const imagens = document.querySelectorAll(seletor);
  console.log(imagens)

  //O proprio navegador manda no scroll.   //1
  if (html.scrollHeight > html.clientHeight || body.scrollHeight > body.clientHeight) return window;
  
  const indices = [
    0, 
    Math.floor(imagens.length * 0.33), //1/3 da pagina
    Math.floor(imagens.length * 0.66),  //2/3 da pagina.
    imagens.length - 1 
  ]

  console.log(indices)

};

// async function iniciarFluxoDeRolagem() {
//   const scroller = window; //Quem vai entregar o elemento vai ser a funcao.

//   //return new Promise((resolve) => {
//     let ultimaAltura = 0;
//     let contadorIgual = 0;

//     const alturaTotal = scroller === window 
//           ? document.documentElement.scrollHeight
//           : scroller.scrollHeight;

//     console.log(alturaTotal)
//   //});
// };

/*
  1 - Client e altura da tela, scroll e o tamanho do conteudo do elemento mesmo se estiver oculto.
*/




