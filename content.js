async function findMangaPages() {
  const images = Array.from(document.querySelectorAll('img'));
 
  const imgsFiltradas = images // 1.1
    .filter((img) => img.naturalHeight > img.naturalWidth && img.naturalWidth > 450)
    .map(img => {
      const rect = img.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      return { 
        elemento: img, 
        posicoes: {
          topo: rect.top + scrollTop,    // Onde começa (Y)
          base: rect.bottom + scrollTop, // Onde termina (Y)
          esquerda: rect.left + scrollX, // Onde começa (X)
          direita: rect.right + scrollX, // Onde termina (X)
          largura: rect.width,
          altura: rect.height,
        }
      }
    });

  if (imgsFiltradas.length > 0) {
    console.log(`Encontradas ${imgsFiltradas.length} possiveis paginas.`);

    const caminho = chrome.runtime.getURL('filtro.js');
    const modulo = await import(caminho);
    
    imgPosfiltro = []; 
    const estadoFetch = { erros: 0 };

    const processarLote = async (lote, comecaEm, estado) => {
      return await Promise.all(lote.map((item, i) => // 1.2
        modulo.filtroImg(item.elemento, item.elemento.src, i + comecaEm, estado, item.posicoes))
      );
    };
    
    if (imgsFiltradas.length > 4) {
      const iniciais = await processarLote(imgsFiltradas.slice(0, 4), 1, estadoFetch);
      const restante = await processarLote(imgsFiltradas.slice(4), 5, estadoFetch);

      imgPosfiltro = [...iniciais, ...restante];
    } else {
      imgPosfiltro = await processarLote(imgsFiltradas, 1, estadoFetch); // 1.3
    };

    imgPosfiltro = imgPosfiltro.filter(item => item !== null);

    console.log(imgPosfiltro); // !!!SOMENTE PARA TESTES, NAO VAI ENTRAR EM PRODUCAO!!!

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


// testes
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "DESENHAR_POPUP") {
    console.log(request.data)
    request.data.forEach(linha => {
      const { boundingBox, text } = linha;
      
      // Pegamos o X e Y inicial (primeiros dois números do array)
      const x = boundingBox[0];
      const y = boundingBox[1];
      // Largura simples (x_topo_direito - x_topo_esquerdo)
      const largura = boundingBox[2] - boundingBox[0]; 

      criarOverlayTexto(text, x, y, largura);
    });
  }
});

function criarOverlayTexto(texto, x, y, largura) {
  const span = document.createElement('span');
  span.innerText = texto;
  
  span.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    min-width: ${largura}px;
    
    /* Estilo Chamativo */
    background-color: rgba(255, 255, 0, 0.9); /* Amarelo forte */
    color: #000;
    font-weight: bold;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    line-height: 1.2;
    padding: 2px 4px;
    
    /* Borda Neon */
    border: 3px solid #ff00ff; /* Magenta Neon */
    box-shadow: 0 0 10px #ff00ff, 0 0 5px #000;
    
    border-radius: 4px;
    z-index: 2147483647; /* O máximo possível para ficar na frente de tudo */
    pointer-events: none; 
    white-space: nowrap;
  `;
  
  document.body.appendChild(span);
}
// testes


// depois vou separar esse arquivo em dois objetos para ficar mais organizado.

// --- Funcao inicial --- 
const esperar = ms => new Promise(res => setTimeout(res, ms));//delay

async function verificaSeContinua() {
  const { estaCorrendo } = await chrome.storage.local.get('estaCorrendo');
  return estaCorrendo === true;
};

// E necessario por causa do F5.
window.addEventListener('load', async () => {
  //testes
  // esperar(1000)
  // findMangaPages()
  //testes
  if(await verificaSeContinua()) executarCarregamentoCompleto();
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
  1.1 - Para Evitar de pegar icones, logotipos ou banners.
  1.2 - O promise.all serve para ele esperar todas as promises serem prontas.
  1.3 - Caso tenha 4 ou menos, processa tudo direto.

  1 - Client e altura da tela, scroll e o tamanho do conteudo do elemento mesmo se estiver oculto.
  2 - scrollTop e a distancia que eu to do top da tela. eu somo a distanc
*/