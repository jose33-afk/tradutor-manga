import { azureConfig } from "./config.js";

export async function gerenciarOCR(objetoImagem) {
  const lotes = GeradorDeLotes.montarLotes(objetoImagem);
  console.table(lotes)
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
      const blob = await this._obterBlob(imageDataUrl);

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

/*
  1.1 - erros 400, 401, 429, 500, etc.
  1.2 - Espera 1.5s segundo antes de verificar novamente
  1.3 - O catch vazio aqui é o que faz o "ignorar erros de rede"
        Se o fetch der erro, ele cai aqui, não faz nada e vai para o setTimeout
  1.4 - O .trim() garante que o endsWith não falhe por causa de espaços invisíveis
  1.5 - limpa pro proximo lote.
  1.6 - Caso sobre algum lote.
  1.7 - desse modo nao precisa percorrer a string inteira duas vezes.
*/