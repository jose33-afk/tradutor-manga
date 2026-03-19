const ICONES = {
  descendo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
  subindo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  sucesso: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  erro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  spinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`
};

const ESTILOS_UI = `
  :root {
    --am-bg-card: #1e1b2e;
    --am-roxo-primario: #8b5cf6;
    --am-roxo-hover: #7c3aed;
    --am-borda: #4c1d95;
    --am-texto: #e2e8f0;
    --am-sucesso: #10b981;
    --am-erro: #ef4444;
  }

  /* --- MODAL DE CONFIRMAÇÃO (Centro) --- */
  #am-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 17, 26, 0.85); backdrop-filter: blur(5px);
    z-index: 9999999; display: flex; justify-content: center; align-items: center;
    opacity: 0; transition: opacity 0.3s ease;
  }
  .am-caixa {
    background: var(--am-bg-card); padding: 24px; border-radius: 12px;
    border: 1px solid var(--am-borda); box-shadow: 0 15px 35px rgba(0,0,0,0.8);
    text-align: center; color: var(--am-texto); font-family: 'Segoe UI', sans-serif;
    max-width: 320px; transform: translateY(20px); transition: transform 0.3s ease;
  }
  .am-caixa h3 { color: #a78bfa; margin: 0 0 10px 0; font-size: 18px; }
  .am-caixa p { margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.4; }
  .am-botoes { display: flex; gap: 12px; justify-content: center; }
  .am-btn { padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; border: none; transition: 0.2s; }
  .am-btn-sim { background: var(--am-roxo-primario); color: white; }
  .am-btn-sim:hover { background: var(--am-roxo-hover); transform: translateY(-1px); }
  .am-btn-nao { background: transparent; border: 1px solid #475569; color: #94a3b8; }
  .am-btn-nao:hover { background: rgba(255,255,255,0.05); color: white; }

  /* --- TOAST DE STATUS (Canto inferior) --- */
  #am-toast {
    position: fixed; bottom: 30px; right: 30px; z-index: 999999;
    background: var(--am-bg-card); color: var(--am-texto); padding: 14px 20px;
    border-radius: 10px; border: 1px solid var(--am-borda);
    font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 500;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0; transform: translateY(30px); pointer-events: none;
  }
  #am-toast.ativo { opacity: 1; transform: translateY(0); pointer-events: all; }
  
  /* Cores de Estado do Toast */
  #am-toast.estado-sucesso { border-color: var(--am-sucesso); background: #064e3b; }
  #am-toast.estado-sucesso svg { color: #34d399; }
  #am-toast.estado-erro { border-color: var(--am-erro); background: #450a0a; }
  #am-toast.estado-erro svg { color: #f87171; }
  
  /* Animações dos Ícones */
  .am-icone svg { width: 24px; height: 24px; color: #a78bfa; }
  @keyframes floatDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
  @keyframes floatUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .am-anim-descendo svg { animation: floatDown 1.5s infinite; }
  .am-anim-subindo svg { animation: floatUp 1.5s infinite; }

  /* NOVA ANIMAÇÃO DE GIRO: */
  @keyframes spinLoading { 100% { transform: rotate(360deg); } }

  .am-anim-descendo svg { animation: floatDown 1.5s infinite; }
  .am-anim-subindo svg { animation: floatUp 1.5s infinite; }
  
  /* APLICANDO O GIRO: */
  .am-anim-spin svg { animation: spinLoading 1s linear infinite; }
`;

export const AvisoManager = {
  _injetarCSS() {
    if (!document.getElementById('am-estilos-injetados')) {
      const style = document.createElement('style');
      style.id = 'am-estilos-injetados';
      style.textContent = ESTILOS_UI;
      document.head.appendChild(style);
    }
  },

  verificarSecontinua(opcoes = {}) { 
    if (typeof opcoes !== 'object' || opcoes === null || Array.isArray(opcoes)) {
      opcoes = {};
    }

    const defaults = {
      titulo: 'Iniciar Varredura?',
      mensagem: 'Deseja rolar a página e capturar os painéis deste capítulo agora?',
      btnSim: 'Iniciar',
      btnNao: 'Cancelar'
    };

    const { titulo, mensagem, btnSim, btnNao } = { ...defaults, ...opcoes };

    return new Promise((resolv) => {
      this._injetarCSS();
      const overlay = document.createElement('div');
      overlay.id = 'am-overlay';
      
      overlay.innerHTML = `
        <div class="am-caixa">
          <h3>${titulo}</h3>
          <p>${mensagem}</p>
          <div class="am-botoes">
            <button class="am-btn am-btn-sim" id="am-sim">${btnSim}</button>
            <button class="am-btn am-btn-nao" id="am-nao">${btnNao}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      requestAnimationFrame(() => { // 1.1
        overlay.style.opacity = '1';
        overlay.querySelector('.am-caixa').style.transform = 'translateY(0)';
      });

      const fechar = (resposta) => {
        overlay.style.opacity = '0';
        overlay.querySelector('.am-caixa').style.transform = 'translateY(20px)';
        setTimeout(() => { overlay.remove(); resolv(resposta); }, 300);
      };

      document.getElementById('am-sim').onclick = () => fechar(true); // 1.2
      document.getElementById('am-nao').onclick = () => fechar(false);
    });
  },

  mostrarStatus(estado, textoCustomizado = null) {
    this._injetarCSS();
    let aviso = document.getElementById('am-toast');

    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'am-toast';
      aviso.innerHTML = `<div class="am-icone"></div><div class="am-texto"></div>`;
      document.body.appendChild(aviso);
    }

    const iconeContainer = aviso.querySelector('.am-icone');
    const textoContainer = aviso.querySelector('.am-texto');

    aviso.className = 'ativo';  // 1.3
    iconeContainer.className = 'am-icone';

    const configs = {
      'descendo':   { icone: ICONES.descendo, texto: 'Mapeando páginas...', anim: 'am-anim-descendo' },
      'subindo': { icone: ICONES.subindo,  texto: 'Retornando ao topo...', anim: 'am-anim-subindo' },
      'fechar':  { icone: ICONES.sucesso,  texto: 'Leitura concluída!', classeExtra: 'estado-sucesso' },
      'erro':    { icone: ICONES.erro,     texto: textoCustomizado || 'Processo interrompido!', classeExtra: 'estado-erro' },
      'carregando': { icone: ICONES.spinner, texto: textoCustomizado || 'Processando...', anim: 'am-anim-spin' }
    };

    const configAtual = configs[estado];
    if (!configAtual) return;

    iconeContainer.innerHTML = configAtual.icone;
    if (configAtual.anim) iconeContainer.classList.add(configAtual.anim);
    textoContainer.innerText = configAtual.texto;
    if (configAtual.classeExtra) aviso.classList.add(configAtual.classeExtra);

    if (estado === 'fechar' || estado === 'erro') {
      const tempo = estado === 'erro' ? 3000 : 2000;

      setTimeout(() => {
        aviso.classList.remove('ativo');
        setTimeout(() => aviso.remove(), 400);

        if (estado === 'erro') {
          try { 
            chrome.runtime.sendMessage({
              action: 'ATUALIZAR_STORAGE_ABA',
              novosDados: { estaCorrendo: false }
            });
          } catch(e) {

          }
        }
      }, tempo);
    }
  },
}

/*
  1.1 - isso e para animacao n bugar, o navegador gosta de otimizar as coisas entao ele nem le o opacity 0 e ja pula pro 1.
  1.2 - da pra usar assim, mas so aceita uma funcao por vez n pode ter mais de uma. E e le so serve para elmentos que criamos e que tenham 
        vida curta. se for colocar em um elemento ja existente ele pode substitui-lo.
          Elemento que VOCÊ criou e vai destruir: onclick é rápido, limpo e direto.
          Elemento que já existe ou é permanente: Sempre use addEventListener para não atropelar ninguém.
  1.3 - limpa o icone e aviso anterior.
*/