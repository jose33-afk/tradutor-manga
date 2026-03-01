import StorageManager from './storageManager.js';

const Dicionario = {
  erro: [
    "⚠️ <strong>A página mudou.</strong> Serviço pausado. Configure novamente.", 
    "⚠️ Escolha idiomas diferentes para traduzir!" ,
  ],                             
  aviso: [
    // Se precisar de avisos amarelos no futuro, coloque aqui
  ],
  info: [
    "🛑 Serviço pausado manualmente."                                            
  ]
};


// const InterfaceManager = {
//   el: null,

//   _mostrarAlerta (msg, type = 'info') {
//     this.el.alerta.innerHTML = msg;
//     this.el.alerta.className = `alerta-box alerta-${type}`;
//     this.el.alerta.style.display = 'block';

//     if (type === 'erro') this.el.btn.disabled = true; // 1.4
//   },

//   _esconderAlerta() {
//     this.el.alerta.style.display = 'none';
//     this.el.btn.disabled = false; // 1.4
//   },

//   _atualizarBotao (ativo) {
//     this.el.btn.innerText = ativo ? "PARAR SERVIÇO" : "LIGAR E ATUALIZAR";
//     ativo ? this.el.btn.classList.add('ativo') : this.el.btn.classList.remove('ativo');
//   },

//   async _verificarMudancaURL(aba, dados) {
//     if (dados.estaCorrendo && dados.ultimaUrl && aba?.url !== dados.ultimaUrl) { // 1.3
//       const novoEstado = StorageManager.variaveisBase;
//       await StorageManager.salvar(novoEstado);
//       this._mostrarAlerta(Dicionario.erro[0], 'erro');
//       return novoEstado;
//     }
//     return dados;
//   },

//   async init() {
//     this.el = {
//       btn: document.querySelector('#btnLigar'),
//       traducao: document.querySelector('#selectIdioma'),
//       origem: document.querySelector('#selectOrigem'),
//       alerta: document.querySelector('#alertaStatus')
//     }

//     try {
//       const dados = await StorageManager.buscar(['estaCorrendo', 'idiomaConfig', 'idiomaOrigem', 'ultimaUrl']);
//       const [aba] = await chrome.tabs.query({ active: true, currentWindow: true });
//       const estadoValidado = await this._verificarMudancaURL(aba, dados);

//       this.el.traducao.value = dados.idiomaConfig || "pt";
//       this.el.origem.value = estadoValidado.idiomaOrigem || "en";
//       this._atualizarBotao(estadoValidado.estaCorrendo);
//       this.registrarEventos();
//     } catch(e) {
//       console.error('Erro na inicialização:', e);
//     }
//   },

//   registrarEventos() {
//     this.el.traducao.addEventListener('change', e => {
//       StorageManager.salvar({ idiomaConfig: e.target.value });
//     });

//     this.el.origem.addEventListener('change', (e) => {
//       StorageManager.salvar({ idiomaOrigem: e.target.value });
//       this._esconderAlerta();
//     });

//     this.el.btn.addEventListener('click', () => this.handleLigarServico());
//   },

//   async handleLigarServico() {
//     const origemSelect = this.el.origem.value;
//     const traducaoSelect = this.el.traducao.value;
    
//     try {
//       const estaCorrendo = await StorageManager.buscar('estaCorrendo');
//       const [aba] = await chrome.tabs.query({ active: true, currentWindow: true });

//       if (estaCorrendo) { // 1.5
//         await StorageManager.salvar(StorageManager.variaveisBase);
//         this._atualizarBotao(false);
//         this._mostrarAlerta(Dicionario.info[0], 'info');
//       } else {
//         if (origemSelect === traducaoSelect && origemSelect !== 'auto') {
//           this._mostrarAlerta(Dicionario.erro[1], "erro");
//           return; // 1.6
//         }

//         await StorageManager.salvar({
//           estaCorrendo: true, 
//           idiomaConfig: traducaoSelect, 
//           idiomaOrigem: origemSelect,
//           ultimaUrl: aba?.url || null
//         }); 

//         this._atualizarBotao(true);
//         this._esconderAlerta();
//       }
//     } catch (e) {
//       console.error("Erro na funcao principal:", e);
//     }
//   }
// }

// document.addEventListener('DOMContentLoaded', () => {
//   InterfaceManager.init();
// });

/*
  1.1 - Usamos [key] para que o JS entenda: "use o VALOR da variável key como nome da propriedade"
  1.2 - Já aceita 'idioma' OU ['idioma', 'estaCorrendo'] nativamente!
  1.3 - Se estava rodando, mas a URL mudou
  1.4 - TRAVA O BOTÃO: O usuário não pode clicar em nada!
  1.5 - PARAR O SERVIÇO
  1.6 - o listener n morre so porque ele encerrou a funcao hand, ele so morre quando fecha a janelinha.
  1.7 - usamos o molde de variaveisBase para não dar erro. no salvar tem uma parte que cria se n existir.
  1.8 - o ! so inverte o resultado da verificacao que esta colado
*/