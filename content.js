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

window.addEventListener('load', async () => {
  let elementoScroll = await encrontrarElementoDeScroll();
  console.log("elemento com scroll:", elementoScroll)
  if (elementoScroll) {
    console.log("Elemento encontrado:", elementoScroll.tagName || "WINDOW");

    // Rola o elemento até o máximo de sua altura interna
    elementoScroll.scrollTo({
      top: elementoScroll.scrollHeight, 
      behavior: 'smooth'
    });
  }

  //TENHO QUE APLIMORAR ISSO PRA IR ROLANDO ATE A ACABAR AS IMGS
  //setTimeout(() => findMangaPages(), 5000); //delay para garantir que as imgs via js carregaram.
});



function encrontrarElementoDeScroll() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const html = document.documentElement; 
      const body = document.body; //para funcionar em qualquer navegador.

      // Função auxiliar para checar se o CSS permite scroll.
      const podeRolar = (element) => {
        const style = window.getComputedStyle(element);
        return style.overflowY !== 'hidden' && style.overflowY !== 'clip';
      };

      if (html.scrollHeight > html.clientHeight && podeRolar(html)) return resolve(html);
      else if (body.scrollHeight > body.clientHeight && podeRolar(body)) return resolve(body);

      const imagens = Array.from(document.querySelectorAll('img')).slice(0, 15)
            .filter((img) => img.offsetWidth > 300 && img.offsetHeight > img.offsetWidth); 

      for (let i = 0; i < imagens.length; i++) {
        let alvo = imagens[i].parentElement;

        while (alvo !== null && alvo !== html && alvo !== body) {
          if (alvo.scrollHeight > alvo.clientHeight && podeRolar(alvo)) {
            const quantidadeInterna = alvo.querySelectorAll('img').length;

            if (quantidadeInterna >= 2) return resolve(alvo);
          };
        
          alvo = alvo.parentElement;
        };

        console.log("Nenhum container específico achado, usando Window.");
        resolve(window);
      };
    }, 2000);
  });
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




