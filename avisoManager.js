const ICONES = {
  descendo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
  subindo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  sucesso: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  erro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  spinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  aviso: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  fecharX: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

const ESTILOS_UI = `
  :root {
    --am-bg-card: #1e1b2e;
    --am-roxo-primario: #8b5cf6;
    --am-borda: #4c1d95;
    --am-texto: #e2e8f0;
    --am-fundo-extremo: #0f111a;
    
    --am-sucesso: #34d399;
    --am-erro: #ef4444;
    --am-info: #60a5fa;
    --am-aviso: #fbbf24;
  }

  /* --- MODAL DE CONFIRMAÇÃO --- */
  #am-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 17, 26, 0.85); backdrop-filter: blur(5px);
    z-index: 9999999; display: flex; justify-content: center; align-items: center;
    opacity: 0; transition: opacity 0.3s ease; padding: 20px; box-sizing: border-box;
  }
  
  .am-caixa {
    background: var(--am-bg-card); padding: 24px; border-radius: 8px;
    border: 1px solid var(--am-borda); box-shadow: 0 15px 35px rgba(0,0,0,0.8);
    text-align: center; color: var(--am-texto); font-family: 'Segoe UI', system-ui, sans-serif;
    width: 100%; max-width: 340px; 
    transform: translateY(20px); transition: transform 0.3s ease;
  }
  
  .am-caixa h3 { color: var(--am-roxo-primario); margin: 0 0 10px 0; font-size: 16px; font-weight: 700; }
  .am-caixa p { margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; line-height: 1.4; }

  .am-botoes { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; align-items: center; }
  .am-btn { 
    padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; 
    border: none; transition: 0.2s; flex: 1 1 auto; white-space: nowrap; font-size: 12px;
  }
  .am-btn-sim { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; }
  .am-btn-sim:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  .am-btn-nao { background: transparent; border: 1px solid #475569; color: #94a3b8; }
  .am-btn-nao:hover { background: rgba(255,255,255,0.05); color: white; }
  .am-btn-ignorar { background: transparent; border: 1px solid var(--am-aviso); color: var(--am-aviso); }
  .am-btn-ignorar:hover { background: rgba(245, 158, 11, 0.1); color: white; }
  .am-btn-desabilitado { opacity: 0.5 !important; cursor: not-allowed !important; filter: grayscale(1); }

  #am-select-dinamico {
    margin: 15px 0; padding: 10px; width: 100%; background: var(--am-fundo-extremo); 
    color: #fff; border: 1px solid var(--am-borda); border-radius: 6px; 
    outline: none; font-size: 13px; font-family: inherit;
  }

  /* --- TOAST BASE --- */
  #am-toast {
    position: fixed; z-index: 999999;
    background: var(--am-bg-card); color: var(--am-texto);
    font-family: 'Segoe UI', system-ui, sans-serif;
    display: flex; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0; pointer-events: none;
  }

  /* --- ESTILO 1: CANTO (PERSISTENTES / Mapear, etc) --- */
  #am-toast.pos-canto { 
    bottom: 30px; right: 30px; transform: translateY(30px);
    border: 1px solid var(--am-borda); border-left: 4px solid var(--am-roxo-primario);
    border-radius: 8px; padding: 14px 20px; gap: 12px;
    align-items: center; flex-direction: row;
    box-shadow: 0 15px 35px rgba(0,0,0,0.8);
  }
  #am-toast.pos-canto.ativo { opacity: 1; transform: translateY(0); pointer-events: all; }
  #am-toast.pos-canto .am-icone svg { width: 24px; height: 24px; color: var(--am-roxo-primario); flex-shrink: 0; }
  #am-toast.pos-canto .am-texto { font-weight: 500; font-size: 14px; text-align: left; }

  /* --- ESTILO 2: CENTRO (TEMPORÁRIOS / Erro, Aviso, etc) --- */
  #am-toast.pos-centro { 
    top: 50%; left: 50%; transform: translate(-50%, -40%) scale(0.95);
    border: 1px solid var(--am-borda); border-radius: 8px;
    width: 100%; max-width: 340px; padding: 30px 24px 24px 24px;
    flex-direction: column; align-items: center; text-align: center;
    box-shadow: 0 25px 50px rgba(0,0,0,0.9);
  }
  #am-toast.pos-centro.ativo { opacity: 1; transform: translate(-50%, -50%) scale(1); pointer-events: all; }

  .am-icone-grande svg { width: 48px; height: 48px; margin-bottom: 12px; }
  .am-titulo { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .am-mensagem { font-size: 13px; color: #94a3b8; line-height: 1.4; width: 100%; }

  .am-btn-fechar-abs {
    position: absolute; top: 10px; right: 10px;
    background: transparent; border: none; color: #94a3b8; cursor: pointer;
    padding: 6px; display: flex; align-items: center; justify-content: center;
    border-radius: 4px; transition: 0.2s;
  }
  .am-btn-fechar-abs:hover { background: rgba(255,255,255,0.1); color: white; }
  .am-btn-fechar-abs svg { width: 18px; height: 18px; }

  /* --- CORES DE ESTADO --- */
  #am-toast.estado-sucesso.pos-centro { border-color: var(--am-sucesso); }
  #am-toast.estado-sucesso.pos-centro .am-icone-grande svg { color: var(--am-sucesso); }
  #am-toast.estado-sucesso.pos-centro .am-titulo { color: var(--am-sucesso); }

  #am-toast.estado-erro.pos-centro { border-color: var(--am-erro); }
  #am-toast.estado-erro.pos-centro .am-icone-grande svg { color: var(--am-erro); }
  #am-toast.estado-erro.pos-centro .am-titulo { color: var(--am-erro); }

  #am-toast.estado-info.pos-centro { border-color: var(--am-info); }
  #am-toast.estado-info.pos-centro .am-icone-grande svg { color: var(--am-info); }
  #am-toast.estado-info.pos-centro .am-titulo { color: var(--am-info); }

  #am-toast.estado-aviso.pos-centro { border-color: var(--am-aviso); }
  #am-toast.estado-aviso.pos-centro .am-icone-grande svg { color: var(--am-aviso); }
  #am-toast.estado-aviso.pos-centro .am-titulo { color: var(--am-aviso); }

  @keyframes floatDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
  @keyframes floatUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes spinLoading { 100% { transform: rotate(360deg); } }
  .am-anim-descendo svg { animation: floatDown 1.5s infinite; }
  .am-anim-subindo svg { animation: floatUp 1.5s infinite; }
  .am-anim-spin svg { animation: spinLoading 1s linear infinite; }
`;

export const AvisoManager = {
  _timerOcultar: null,
  _resolverModalAtivo: null, 
  _objeto(val) { return typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0; },

  _injetarCSS() {
    if (!document.getElementById('am-estilos-injetados')) {
      const style = document.createElement('style');
      style.id = 'am-estilos-injetados';
      style.textContent = ESTILOS_UI;
      document.head.appendChild(style);
    }
  },

  _prepararElementoToast() {
    let aviso = document.getElementById('am-toast');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'am-toast';
      document.body.appendChild(aviso);
    }
    aviso.className = ''; 
    return aviso;
  },

  _ocultarStatus(imediato = false) {
    if (this._timerOcultar) { clearTimeout(this._timerOcultar); this._timerOcultar = null; }
    const avisoExistente = document.getElementById('am-toast');
    if (!avisoExistente) return;

    avisoExistente.classList.remove('ativo');
    if (imediato) {
      avisoExistente.remove();
    } else {
      setTimeout(() => { if (avisoExistente.parentNode) avisoExistente.remove(); }, 400);
    }
  },

  _lidarComErroDoBackground() {
    try { 
      chrome.runtime.sendMessage({
        action: "GERENCIAR_STORAGE_ABA",
        escopo: "aba",
        metodo: "salvar",
        dados: { estaCorrendo: false }
      });
    } catch(e) { }
  },

  verificarSecontinua(opcoes = {}) { 
    return new Promise((resolv) => {
      this._injetarCSS();
      
      const overlayAntigo = document.getElementById('am-overlay');
      if (overlayAntigo) {
        if (this._resolverModalAtivo) {
          this._resolverModalAtivo(false); 
        }
        overlayAntigo.remove(); 
      }
      this._resolverModalAtivo = resolv;

      const defaults = { titulo: 'Iniciar Varredura?', mensagem: '...', btnSim: 'Iniciar', btnNao: 'Cancelar', tempoAutoFechamento: null };
      const config = { ...defaults, ...opcoes };

      const overlay = document.createElement('div');
      overlay.id = 'am-overlay';
      
      let htmlSelect = config.opcoesSelect ? `
          <select id="am-select-dinamico">
            <option value="" disabled selected>Selecione o idioma...</option>
            ${config.opcoesSelect.map(op => `<option value="${op.valor}">${op.texto}</option>`).join('')}
          </select>` : '';

      overlay.innerHTML = `
        <div class="am-caixa">
          <h3>${config.titulo}</h3><p>${config.mensagem}</p>${htmlSelect}
          <div class="am-botoes">
            <button class="am-btn am-btn-sim" id="am-sim">${config.btnSim}</button>
            <button class="am-btn am-btn-nao" id="am-nao">${config.btnNao}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.am-caixa').style.transform = 'translateY(0)';
      });

      let intervaloContador = null;

      const fechar = (res) => {
        if (intervaloContador) {
          clearInterval(intervaloContador)
          intervaloContador = null;
        };

        overlay.style.opacity = '0';
        setTimeout(() => { 
          if (overlay.parentNode) overlay.remove(); 
          
          if (this._resolverModalAtivo === resolv) {
            this._resolverModalAtivo = null;
          }
          resolv(res); 
        }, 300);
      };

      const btnSimEl = overlay.querySelector('#am-sim');
      const bntNaoEl = overlay.querySelector('#am-nao');
      const selectEl = overlay.querySelector('#am-select-dinamico');

      if (selectEl) {
        btnSimEl.disabled = true;
        btnSimEl.classList.add('am-btn-desabilitado');
        selectEl.onchange = () => {
          btnSimEl.disabled = !selectEl.value;
          btnSimEl.classList.toggle('am-btn-desabilitado', !selectEl.value);
        };
      }

      if (config.tempoAutoFechamento && !config.opcoesSelect) {
        let segundos = Math.floor(config.tempoAutoFechamento / 1000);
        const textoOriginalSim = config.btnSim;

        btnSimEl.innerText = `${textoOriginalSim} (${segundos}s)`;

        intervaloContador = setInterval(() => {
          segundos--;

          if (segundos > 0) btnSimEl.innerText = `${textoOriginalSim} (${segundos}s)`;
          else fechar(true);
          
        }, 1000);
      }

      btnSimEl.onclick = () => fechar(selectEl ? selectEl.value : true);
      bntNaoEl.onclick = () => fechar(false);
    });
  },

  mostrarStatus(estado, textoOuOpcoes = null, opcoesExtras = {}) {
    if (estado === 'ocultar') return this._ocultarStatus();

    let textoCustomizado = null;
    
    if (textoOuOpcoes !== null && this._objeto(textoOuOpcoes)) {
      opcoesExtras = textoOuOpcoes;
    } else {
      textoCustomizado = textoOuOpcoes;
    }

    if (opcoesExtras.tempo) opcoesExtras.persistente = false;

    const configuracoesBase = {
      'descendo':   { layout: 'canto',  icone: ICONES.descendo, texto: textoCustomizado || 'Mapeando páginas...', anim: 'am-anim-descendo', persistente: true, titulo: 'Mapeando' },
      'subindo':    { layout: 'canto',  icone: ICONES.subindo,  texto: textoCustomizado || 'Retornando ao topo...', anim: 'am-anim-subindo', persistente: true, titulo: 'Subindo' },
      'carregando': { layout: 'canto',  icone: ICONES.spinner,  texto: textoCustomizado || 'Processando...', anim: 'am-anim-spin', persistente: true, titulo: 'Processando' },
      
      'fechar':     { layout: 'centro', icone: ICONES.sucesso,  titulo: 'Concluído!', classe: 'estado-sucesso', persistente: false, tempo: 2000 },
      'erro':       { layout: 'centro', icone: ICONES.erro,     titulo: 'Erro Crítico!', classe: 'estado-erro', persistente: false, tempo: 4000 },
      'info':       { layout: 'centro', icone: ICONES.info,     titulo: 'Informação', classe: 'estado-info', persistente: false, tempo: 3000 },
      'aviso':      { layout: 'centro', icone: ICONES.aviso,    titulo: 'Atenção', classe: 'estado-aviso', persistente: false, tempo: 3000 },
    };

    const base = configuracoesBase[estado];
    if (!base) return;

    const config = { ...base, ...opcoesExtras };
    if (base.layout === 'centro') config.layout = 'centro';

    this._injetarCSS();
    this._ocultarStatus(true); 

    const aviso = this._prepararElementoToast();
    let htmlContent = '';

    if (config.layout === 'canto') {
      htmlContent += `<div class="am-icone ${config.anim || ''}">${config.icone}</div>`;
      htmlContent += `<div class="am-texto">${config.texto}</div>`;
      aviso.classList.add('pos-canto');
    } else {
      htmlContent += `<button class="am-btn-fechar-abs" id="am-fechar-btn">${ICONES.fecharX}</button>`;
      htmlContent += `<div class="am-icone-grande ${config.anim || ''}">${config.icone}</div>`;
      htmlContent += `<div class="am-titulo">${config.titulo}</div>`;
      htmlContent += `<div class="am-mensagem">${textoCustomizado || 'Aguarde...'}</div>`;
      aviso.classList.add('pos-centro');
      if (config.classe) aviso.classList.add(config.classe);
    }

    aviso.innerHTML = htmlContent;

    requestAnimationFrame(() => aviso.classList.add('ativo'));

    if (!config.persistente) {
      const btnFechar = aviso.querySelector('#am-fechar-btn');
      if (btnFechar) btnFechar.onclick = () => this._ocultarStatus();

      this._timerOcultar = setTimeout(() => {
        this._ocultarStatus();
        if (estado === 'erro') this._lidarComErroDoBackground();
      }, config.tempo || 3000);
    }
  },
}