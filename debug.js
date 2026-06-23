// SOMENTE PARA TESTES, INSPECIONAR BUGADO

const containerAbas = document.getElementById('container-abas');
const containerGlobais = document.getElementById('container-globais');
const btnAtualizar = document.getElementById('btn-atualizar');
const btnLimpar = document.getElementById('btn-limpar');

// Memórias de histórico rigorosamente separadas por escopo
let historicoAbas = {}; 
let historicoGlobais = {}; 

function colorizarJSON(obj) {
  let str = JSON.stringify(obj, null, 2);
  str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let classe = 'token-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        classe = 'token-key';
        return '<span class="' + classe + '">' + match.slice(0, -1) + '</span>:';
      } else {
        classe = 'token-string';
      }
    } else if (/true|false/.test(match)) {
      classe = 'token-boolean';
    } else if (/null/.test(match)) {
      classe = 'token-null';
    }
    return '<span class="' + classe + '">' + match + '</span>';
  });
}

function gerenciarFoco(card) {
  card.addEventListener('click', function(e) {
    if (window.getSelection().toString().length > 0) return;
    
    const jaEstaFocado = this.classList.contains('focado');
    
    document.querySelectorAll('.card').forEach(c => c.classList.remove('focado'));
    document.body.classList.remove('has-focus');

    if (!jaEstaFocado) {
      this.classList.add('focado');
      document.body.classList.add('has-focus');
    }
  });
}

// Fecha o modal se clicar na tela escura de fundo
document.addEventListener('click', function(e) {
  if (!e.target.closest('.card') && document.body.classList.contains('has-focus')) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('focado'));
    document.body.classList.remove('has-focus');
  }
});

function carregarTodosOsDados() {
  chrome.storage.local.get(null, (allData) => {
    document.body.classList.remove('has-focus');
    containerAbas.innerHTML = '';
    containerGlobais.innerHTML = '';
    
    const chaves = Object.keys(allData);
    let temAbas = false;
    let temGlobais = false;

    if (chaves.length === 0) {
      const avisoVazio = '<div class="vazio">Nenhum dado encontrado no storage local.</div>';
      containerAbas.innerHTML = avisoVazio;
      containerGlobais.innerHTML = avisoVazio;
      return;
    }

    chaves.forEach(chave => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const header = document.createElement('div');
      
      // Criando o "X" de fechar
      const spanFechar = document.createElement('span');
      spanFechar.className = 'btn-fechar';
      spanFechar.innerHTML = '✖';
      
      // O invólucro flex para dividir a tela
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'content-wrapper';
      
      // Define de qual histórico puxar baseado na chave
      const versaoAnterior = chave.startsWith('aba_') ? historicoAbas[chave] : historicoGlobais[chave];

      // Monta o Painel Antigo (Esquerda)
      const painelAntigo = document.createElement('div');
      painelAntigo.className = 'painel-antigo';
      
      if (versaoAnterior) {
        painelAntigo.innerHTML = `<div class="painel-title">🔴 Versão Anterior</div><pre>${colorizarJSON(versaoAnterior)}</pre>`;
      } else {
        painelAntigo.innerHTML = `<div class="painel-title">🔴 Versão Anterior</div><div class="vazio" style="margin-top: 40px; border:none;">Sem histórico nesta sessão</div>`;
      }

      // Monta o Painel Atual (Direita)
      const painelAtual = document.createElement('div');
      painelAtual.className = 'painel-atual';
      painelAtual.innerHTML = `<div class="painel-title">🟢 Versão Atual</div><pre>${colorizarJSON(allData[chave])}</pre>`;
      
      contentWrapper.appendChild(painelAntigo);
      contentWrapper.appendChild(painelAtual);
      card.appendChild(header);
      card.appendChild(contentWrapper);

      gerenciarFoco(card);

      // Lógica do X: fecha o modal e impede que ele reabra pelo clique no header
      spanFechar.addEventListener('click', (e) => {
        e.stopPropagation(); 
        card.classList.remove('focado');
        document.body.classList.remove('has-focus');
      });

      if (chave.startsWith('aba_')) {
        header.className = 'card-header';
        header.textContent = `📄 ${chave}`; 
        header.appendChild(spanFechar); // Adiciona o X no canto direito
        containerAbas.appendChild(card);
        temAbas = true;
      } else {
        header.className = 'card-header global';
        header.textContent = `⚙️ ${chave}`; 
        header.appendChild(spanFechar); // Adiciona o X no canto direito
        containerGlobais.appendChild(card);
        temGlobais = true;
      }
    });

    if (!temAbas) containerAbas.innerHTML = '<div class="vazio">Nenhuma estrutura do tipo "aba_" ativa no momento.</div>';
    if (!temGlobais) containerGlobais.innerHTML = '<div class="vazio">Nenhum metadado ou configuração global registrada.</div>';
  });
}

btnAtualizar.addEventListener('click', () => {
  carregarTodosOsDados();
  btnAtualizar.textContent = 'Refreshed!'; 
  setTimeout(() => btnAtualizar.textContent = 'Force Refresh', 1000);
});

btnLimpar.addEventListener('click', () => {
  if (confirm('Atenção: Isto irá apagar ABSOLUTAMENTE TODOS OS DADOS do local storage da extensão. Continuar?')) {
    chrome.storage.local.clear(() => {
      // Zera ambos os históricos visuais ao apagar o banco
      historicoAbas = {}; 
      historicoGlobais = {}; 
      carregarTodosOsDados();
    });
  }
});

carregarTodosOsDados();

// Escuta as atualizações do storage e roteia a versão antiga para o objeto correto
chrome.storage.onChanged.addListener((changes) => {
  for (let [key, { oldValue }] of Object.entries(changes)) {
    if (oldValue !== undefined) {
      if (key.startsWith('aba_')) {
        historicoAbas[key] = oldValue;
      } else {
        historicoGlobais[key] = oldValue;
      }
    }
  }
  carregarTodosOsDados();
});