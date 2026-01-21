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

const esperar = ms => new Promise(res => setTimeout(res, ms));//delay

window.addEventListener('load', async () => {
  let elementoScroll = await encrontrarElementoDeScroll();

  await esperar(600);

  if(await carregarPaginaManga(elementoScroll)) console.log("Tudo pronto! Todas as imagens foram disparadas.");
  else console.error("Falha ao percorrer o mangá.");

  //TENHO QUE APLIMORAR ISSO PRA IR ROLANDO ATE A ACABAR AS IMGS
  //setTimeout(() => findMangaPages(), 5000); //delay para garantir que as imgs via js carregaram.
});

// --- Funcoes para rologem ate o final da pagina ---
async function scrollSeguro(element) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      element.scrollBy({
        top: window.innerHeight * 0.8, //80% da altura da janela.
        behavior: 'smooth'
      });
      setTimeout(resolve, 600); //Internet lenta/processador carregar.
    });
  });
};

function chegouAoFim(s) {
  const total = s.scrollHeight || document.documentElement.scrollHeight;
  const visivel = s === window ? window.innerHeight : s.clientHeight;
  const atual = s === window ? window.scrollY : s.scrollTop;
  return atual + visivel >= total - 100;
};

function carregarPaginaManga(scroller) {
  return new Promise(async (resolve) => {
    let alturaAnterior = 0;
    let tentativasSemMudanca = 0;
    let end = false;
    const LIMITE_TENTATIVAS = 3;

    // --- MODO 1: Dinamico (Manga plus / Sites que crescem) ---
    while (tentativasSemMudanca < LIMITE_TENTATIVAS) {
      await scrollSeguro(scroller);
      await esperar(500)
      end = chegouAoFim(scroller);

      if (end) {
        let alturaAtual = scroller.scrollHeight || document.documentElement.scrollHeight;

        if (alturaAtual > alturaAnterior) {
          alturaAnterior = alturaAtual;
          tentativasSemMudanca = 0;
        } else tentativasSemMudanca++;
      };
    };
    
    if (end) return resolve(true);
    else return resolve(false)
  });
}; 

// -- Encontrar Elmento responsavel pelo scroll da pagina --
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



/*
  1 - Client e altura da tela, scroll e o tamanho do conteudo do elemento mesmo se estiver oculto.
  2 - scrollTop e a distancia que eu to do top da tela. eu somo a distanc
*/




