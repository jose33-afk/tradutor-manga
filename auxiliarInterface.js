const bnt = document.querySelector('#btnLigar');

// modifica o estado do bnt conforme o estado da variavel estaCorrendo.
function configurarBotao(estado) {
  bnt.innerText = estado ? "PARAR CARREGAMENTO" : "LIGAR E ATUALIZAR";
  bnt.style.background = estado ? "#ef4444" : "#22c55e";
};

// Assim que abrir(interface extensao) ele consulta o storage.
(async () => {
  const { estaCorrendo } = await chrome.storage.local.get('estaCorrendo');
  configurarBotao(estaCorrendo);
})();

// Para mudar o estado do bnt permanentemente.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.estaCorrendo) {
    const novoValor = changes.estaCorrendo.newValue;
    configurarBotao(novoValor);
  };
});

bnt.addEventListener('click', async () => {
  const { estaCorrendo } = await chrome.storage.local.get('estaCorrendo');//2
  
  if (estaCorrendo) {
    //Se ja esta rodando, apenas desliga a variavel(o content.js vai perceber).
    await chrome.storage.local.set({ estaCorrendo: false });
    window.close();
  } else {
    await chrome.storage.local.set({ estaCorrendo: true });
    const [abaAtiva] = await chrome.tabs.query({ active: true, currentWindow: true });//3 
    chrome.tabs.reload(abaAtiva.id);
  };

});


/*
  1 - tipo um eventLisner. -- o get sempre entrega em formato de {}.
  2 - assim pega o valor e precisa ser igual, se quiser mudar o nome e assim {estaCorrendo:nomenovo}
  3 - primeiro ele retorna uma array por padrao. Segundo e uma pesquisa nas abas do navegador active:true e a aba que esta destacada
      na barra la em cima no navegador.
      currentWindow e o local onde esse script esta sendo executado.
*/