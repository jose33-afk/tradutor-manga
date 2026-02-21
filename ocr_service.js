import { azureConfig } from "./config.js";

export async function gerenciarOCR(objetoImagem) {
  const listaLimpa = objetoImagem.filter(img => img.imageDataUrl && img.posicoes);
  
  const lotes = GeradorDeLotes.montarLotes(listaLimpa);
  console.table(lotes)
  const lotesPosProcessamento = await CosturarImages.gerarImagemUnica(lotes);
  console.table(lotesPosProcessamento)
  // FALTA TESTAR VISUALMENTE A IMG UNICA.
};


const Azure = {
  //Sujeito a alteracao, talvez n seja necessario
  async _obterBlob(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return await res.blob();
  },
  //Sujeito a alteracao, talvez n seja necessario

  async processarOCR (objetoImagem) {
    const { imageDataUrl, index, posicoes } = objetoImagem;
    const { endpoit, apiKey } = azureConfig;
    const url = `${endpoit}vision/v3.2/read/analyze`;
    
    try {
      //Sujeito a alteracao, talvez n seja necessario
      const blob = await this._obterBlob(imageDataUrl);
      //Sujeito a alteracao, talvez n seja necessario

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureConfig.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: blob
      });

      if (!response.ok) throw new Error(`Status Azure: ${response.status}`); // 1.1 

      const linkEspera = response.headers.get('Operation-Location');
      if (!linkEspera) throw new Error('Header Operation-Location ausente'); 

      const resultado = await this._vigiarLink(linkEspera, apiKey);
      if (!resultado?.sucesso) throw new Error(resultado?.erro || 'Erro no polling');

      return { index, posicoes, azure: resultado.texto };
    } catch (e) {
      console.error(`[Abortado] Erro em Azure.processarOCR: ${e.message}`);
      return null;
    };
  },

  async _vigiarLink(link, apiKey) {
    const tempoMaximo = 30000 // 30s
    const inicio = Date.now();

    while (Date.now() - inicio < tempoMaximo) { 
      try {
        const response = await fetch(link, {
          headers: { 'Ocp-Apim-Subscription-Key': apiKey }
        });

        if (response.ok) {
          const { status, analyzeResult } = await response.json();

          if (status === 'succeeded') {
            const linhas = analyzeResult?.readResults?.[0]?.lines;

            return linhas?.length
              ? { sucesso: true, texto: linhas } 
              : { sucesso: false, erro: "Imagem sem texto detectável" }
          };

          if (status === 'failed') {
            return { sucesso: false, erro: "Azure falhou no processamento" };
          };
        };
      } catch (e) {
        // 1.3
      };

      await new Promise(resolv => setTimeout(resolv, 1500)); // 1.2
    };

    return { sucesso: false, erro: "Tempo esgotado (Timeout 30s)" };
  },
};

const GeradorDeLotes = {
  ALTURA_MAX: 10000, // Pixeis
  PESO_MAX: 4 * 1024 * 1024, // 4MB

  _calcularPesoReal(base64String) {
    const stringPura = (base64String.split(',')[1] || base64String).trim(); // 1.4
    const sufixo = stringPura.slice(-2); // 1.7
    const padding = sufixo.endsWith('==') ? 2 : (sufixo.endsWith('=') ? 1 : 0);
    return Math.floor((stringPura.length * 0.75) - padding);
  },

  montarLotes(listaImagens) {
    const lotes = [];
    let loteAtual = { imagens: [], alturaTotal: 0, pesoTotal: 0 };

    for (const img of listaImagens) {
      const { larguraReal, alturaReal } = img.posicoes;
      if (!larguraReal || !alturaReal) continue;

      const pesoImg = this._calcularPesoReal(img.imageDataUrl);
      const estourouAltura = (loteAtual.alturaTotal + alturaReal) > this.ALTURA_MAX;
      const estorouPeso = (loteAtual.pesoTotal + pesoImg) > this.PESO_MAX;
  
      if ((estourouAltura || estorouPeso) && loteAtual.imagens.length > 0) {
        lotes.push(loteAtual);
        loteAtual = { imagens: [], alturaTotal: 0, pesoTotal: 0 }; // 1.5
      };

      loteAtual.imagens.push({
        ...img,
        offsetY: loteAtual.alturaTotal,
        pesoReal: pesoImg
      });

      loteAtual.alturaTotal += alturaReal;
      loteAtual.pesoTotal += pesoImg;
    };
    
    if (loteAtual.imagens.length > 0) lotes.push(loteAtual); // 1.6
    return lotes;
  },
};

const CosturarImages = {
  async _carregarImagem(url) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await createImageBitmap(blob);
    } catch(e) {
      return null;
    }
  },

  async _processarTodosLotes(todosLotes) {
    for (const lote of todosLotes) {
      lote.imagens = await Promise.all( // 2
        lote.imagens.map(async (img) => {
          const el = await this._carregarImagem(img.imageDataUrl);
          return el ? { ...img, imageDataUrl: el } : null; // 1.9
        })
      );

      lote.imagens = lote.imagens.filter(img => img.imageDataUrl !== null);

      let cursorY = 0; // 2.2
      lote.imagens.forEach(img => {
        img.offsetY = cursorY;
        cursorY += img.imageDataUrl.height;
      });

      lote.alturaTotal = cursorY;
    }
    return todosLotes
  },

  async gerarImagemUnica(lotes) {
    if (!lotes?.length) return null;
    const LotesProcessados = await this._processarTodosLotes(lotes);
    let idAtual = 0;

    for (const lote of LotesProcessados) {
      const larguraMax = Math.max(...lote.imagens.map(img => img.imageDataUrl.width)); // 2.3

      const canvas = new OffscreenCanvas(larguraMax, lote.alturaTotal);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const img of lote.imagens) {
        ctx.drawImage(img.imageDataUrl, 0, img.offsetY);
        img.imageDataUrl.close(); // Libera a RAM da gpu.
      };

      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality:0.95 }); // 2.4

      const loteAtualizado = {
        id: idAtual++,
        blob,
        totalImagens: lote.imagens.length,
        imagens: lote.imagens.map(img => ({
          index: img.index,
          offsetY: img.offsetY,
          posicoes: {
            topo: img.posicoes.topo,
            esquerda: img.posicoes.esquerda,
            larguraTela: img.posicoes.larguraTela,
            alturaTela: img.posicoes.alturaTela,
            larguraReal: img.posicoes.larguraReal,
            alturaReal: img.posicoes.alturaReal
          }
        }))
      };

      for (const key in lote) delete lote[key]; // 2.6
      Object.assign(lote, loteAtualizado);

      canvas.width = 0;
      canvas.height = 0;
    };
    return LotesProcessados;
  },
};

/*
  1.1 - erros 400, 401, 429, 500, etc.
  1.2 - Espera 1.5s segundo antes de verificar novamente
  1.3 - O catch vazio aqui é o que faz o "ignorar erros de rede"
        Se o fetch der erro, ele cai aqui, não faz nada e vai para o setTimeout
  1.4 - O .trim() garante que o endsWith não falhe por causa de espaços invisíveis
  1.5 - limpa pro proximo lote.
  1.6 - Caso sobre algum lote.
  1.7 - desse modo nao precisa percorrer a string inteira duas vezes.
  1.8 - nao precisa do new aqui porque o metodo all e nativo do js, quando eu uso o new
        eu estou criando uma nova instancia.
  1.9 - Os obj do js nao aceitam valor duplicado, oque esta acontecendo ai e;
        eu copiei o obj todo e ele ja contem um "imageDataUrl", como ele ja existe 
        o js so substitui o valor pelo ultimo passado.

        a brisa aqui e que o map e a funcao anonima sao duas entidades 
        o map n entende await mais a funcao anonima sim. ele esta chamando duas
        funcoes ao mesmo tempo, uma que seria meio que o gerenciador e a outra a 
        funcao carregar. o map chama todas as funcoes anonimas e vaza, depois quem
        espera o resultado e a funcao anonima que entende await.
  2.1 - nao vai travar porque o proprio fetch ja tem um limite de 6 por vez o resto fica na fila.
  2.2 - Caso alguma img falhe recalcula a altura pro canvas nao ficar com buracos.
  2.3 - map: O JS percorre o array de objetos e cria um array temporário só de números (ex: [800, 810, 800]).
        ...: O JS "explode" esse array temporário em argumentos soltos.
        Math.max: Pega esses argumentos e decide qual é o maior.
  2.4 - tem que comprimiar de qualquer jeito o canvas n aceita sair sem compressao se n passar um valor 
        o broser escolhe sozinho. 95 e para garantir que a perga de qualidade seja minima.
  2.5 - assim da pra separar uma propriedade facil.
  2.6 - eu apago os dados do obj original e depois preencho com o meu novo obj.
*/