const estiloPopup = `
  .status-erro {
    background: rgba(239, 68, 68, 0.9) !important; 
    border: 1px solid #ef4444;
  }
  .status-sucesso {
    background: rgba(16, 185, 129, 0.9) !important; 
    border: 1px solid #10b981;
  }

  #tradutor-manga-extensao-loader-popup {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    font-family: sans-serif;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    transition: all 0.5s ease;
  }

  .seta-animada {
      font-size: 24px;
      margin-bottom: 5px;
      animation: bounce 1s infinite;
  }

  @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(10px); }
  }

  @keyframes bounceUp {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
  }

  .animacao-subindo {
      animation: bounceUp 1s infinite !important;
  }
`;

const fecharComDelay = (popup, delay, encerrarPrograma = false) => {
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)';

    setTimeout(() => {
      popup.remove();
      if(encerrarPrograma) chrome.storage.local.set({ estaCorrendo: false });
    }, 500);
  }, delay);
};

export function gerirPopup(acao, msCustom) {
  let popup = document.getElementById('tradutor-manga-extensao-loader-popup');
  
  if (acao === 'abrir') {
    if (!popup) {
      const styleSheet = document.createElement('style'); //tag style so entende txt.
      styleSheet.innerText = estiloPopup;
      document.head.appendChild(styleSheet);

      popup = document.createElement('div');
      popup.id = 'tradutor-manga-extensao-loader-popup';
      popup.innerHTML = `
        <div class="seta-animada">↓</div>
        <div class="mensagem-status">A carregar imagens...</div>
      `;
      document.body.appendChild(popup);
    };
  };

  // ATUALIZAR para o modo de subida
  if (acao === 'subindo') {
    if (popup) {
      const seta = popup.querySelector('.seta-animada')
      seta.innerHTML = '↑';
      seta.classList.add('animacao-subindo');
      popup.querySelector('.mensagem-status').innerText = 'Subindo ate o topo...';
    };
  };

  //FECHAR o popup
  if (acao === 'fechar') {
    if(popup) {
      const seta = popup.querySelector('.seta-animada')
      seta.innerHTML = '✓'; 
      seta.classList.remove('animacao-subindo');
      popup.classList.add('status-sucesso');
      popup.querySelector('.mensagem-status').innerText = 'Carregamento completo!';

      fecharComDelay(popup, 1500); //1.5 segundos. 
    };
  };

  // ESTADO de erro.
  if (acao === 'erro') {
    const seta = popup.querySelector('.seta-animada');
    seta.innerHTML = '⚠';
    seta.classList.remove('animacao-subindo');
    popup.classList.add('status-erro');

    popup.querySelector('.mensagem-status').innerText = msCustom || 'Erro inesperado!';
    fecharComDelay(popup, 2500, true);
  };
};