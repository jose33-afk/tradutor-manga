import { azureConfig } from "./config.js";

export async function gerenciarOCR(objetoImagem) {
  const listaLimpa = objetoImagem.filter(img => img.imageDataUrl && img.posicoes);
  
  const lotes = GeradorDeLotes.montarLotes(listaLimpa);
  console.table(lotes)
  CosturarImages.gerarImagemUnica(lotes);
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
      )

      console.log(lote.imagens)
    }
  },

  async gerarImagemUnica(lotes) {
    await this._processarTodosLotes(lotes);
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
*/