async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
 
  //Para Evitar de pegar icones, logotipos ou banners.
  const imgsFiltradas = images
    .filter((img) => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450)
    .map(img => img);

  if (imgsFiltradas.length > 0) {
    console.log(`Encontradas ${imgsFiltradas.length} possiveis paginas.`);

    const caminho = chrome.runtime.getURL('filtro.js');
    const modulo = await import(caminho);
    
    //O promise.all serve para ele esperar todas as promises serem prontas.
    imgPosfiltro = [];
    const estadoFetch = { erros: 0 };

    const processarLote = async (lote, comecaEm, estado) => {
      return await Promise.all(lote.map((element, i) => 
        modulo.filtroImg(element, element.src, i + comecaEm, estado))
      );
    };
    
    if (imgsFiltradas.length > 4) {
      const iniciais = await processarLote(imgsFiltradas.slice(0, 4), 1, estadoFetch);
      const restante = await processarLote(imgsFiltradas.slice(4), 5, estadoFetch);

      imgPosfiltro = [...iniciais, ...restante];
    } else {
      // Caso tenha 4 ou menos, processa tudo direto.
      imgPosfiltro = await processarLote(imgsFiltradas, 1, estadoFetch);
    };

    console.log(imgPosfiltro); // Para verificacao de bugs.

    // NOTA DE PERFORMANCE:
    // Se a extensão apresentar lentidão ou travar a aba, devemos processar o restante 
    // das imagens em lotes (batches) menores, em vez de disparar todas simultaneamente 
    // após a verificação do limite de erros.

    const capituloUrl = window.location.href;
    const site = new URL(capituloUrl).hostname;
 
    chrome.runtime.sendMessage({
      action: "PROCESSAR_CAPITOLO",
      dadosExtras: {
        capituloUrl,
        site,
      },  
      data: imgPosfiltro
    });
 };
};

// --- Funcao inicial --- 
const esperar = ms => new Promise(res => setTimeout(res, ms));//delay

async function verificaSeContinua() {
  const { estaCorrendo } = await chrome.storage.local.get('estaCorrendo');
  return estaCorrendo === true;
};

// E necessario por causa do F5.
window.addEventListener('load', async () => {
  //testes
  esperar(1000)
  findMangaPages()
  //testes
  //if(await verificaSeContinua()) executarCarregamentoCompleto();
});

async function executarCarregamentoCompleto() {
  const caminhoDaFunc = chrome.runtime.getURL('popDescida.js');
  const modulo = await import(caminhoDaFunc);

  let elementoScroll = await encrontrarElementoDeScroll();

  if (elementoScroll) {
    modulo.gerirPopup('abrir');
    await esperar(600);

    const sucesso = await carregarPaginaManga(elementoScroll);

    if(sucesso) {
      modulo.gerirPopup('subindo');

      elementoScroll.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      esperar(2000);
      modulo.gerirPopup('fechar');
      findMangaPages();
    
    } else {
      modulo.gerirPopup('erro', 'Falha ao percorrer o mangá.');
    };
  };
};

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

async function carregarPaginaManga(scroller) {
  let alturaAnterior = 0;
  let tentativasSemMudanca = 0;
  let end = false;
  const LIMITE_TENTATIVAS = 3;

  // --- MODO 1: Dinamico (Manga plus / Sites que crescem) ---
  while (tentativasSemMudanca < LIMITE_TENTATIVAS) {
    if (!await verificaSeContinua()) {
      console.log("🛑 Interrupção manual: Parando o scroll.");
      return false;
    };

    await scrollSeguro(scroller);
    await esperar(500);

    end = chegouAoFim(scroller);

    if (end) {
      let alturaAtual = scroller.scrollHeight || document.documentElement.scrollHeight;

      if (alturaAtual > alturaAnterior) {
        alturaAnterior = alturaAtual;
        tentativasSemMudanca = 0;
      } else tentativasSemMudanca++;
    };
  };
  
  return end;
}; 

// -- Encontrar Elmento responsavel pelo scroll da pagina --
async function encrontrarElementoDeScroll() {
  await esperar(2000);

  const html = document.documentElement; 
  const body = document.body; //para funcionar em qualquer navegador.

  // Função auxiliar para checar se o CSS permite scroll.
  const podeRolar = (element) => {
    const style = window.getComputedStyle(element);
    return style.overflowY !== 'hidden' && style.overflowY !== 'clip';
  };

  if (html.scrollHeight > html.clientHeight && podeRolar(html)) return html;
  if (body.scrollHeight > body.clientHeight && podeRolar(body)) return body;

  const imagens = Array.from(document.querySelectorAll('img')).slice(0, 15)
        .filter((img) => img.offsetWidth > 300 && img.offsetHeight > img.offsetWidth); 

  for (let i = 0; i < imagens.length; i++) {
    let alvo = imagens[i].parentElement;

    while (alvo !== null && alvo !== html && alvo !== body) {
      if (alvo.scrollHeight > alvo.clientHeight && podeRolar(alvo)) {
        const quantidadeInterna = alvo.querySelectorAll('img').length;

        if (quantidadeInterna >= 2) return alvo;
      };
    
      alvo = alvo.parentElement;
    };

    console.log("Nenhum container específico achado, usando Window.");
    return window;
  };
};



/*
  1 - Client e altura da tela, scroll e o tamanho do conteudo do elemento mesmo se estiver oculto.
  2 - scrollTop e a distancia que eu to do top da tela. eu somo a distanc
*/