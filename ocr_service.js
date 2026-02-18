import { azureConfig } from "./config.js";

export async function gerenciarOCR(objetoImagem) {
  GeradorDeLotes.montarLotes(objetoImagem);
};


const Azure = {
  //Sujeito a alteracao, talvez n seja necessario
  async _obterBlob(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return await res.blob();
  },

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
    const stringPura = base64String.split(',')[1] || base64String;
    const padding = stringPura.endsWith('==') ? 2 : (stringPura.endsWith('=') ? 1 : 0);
    console.log(stringPura)
    console.log('padding:', padding)
  },

  montarLotes(obj) {
    const lotes = [];

    this._calcularPesoReal(obj[4].imageDataUrl)
  }
}
/*
  1.1 - erros 400, 401, 429, 500, etc.
  1.2 - Espera 1.5s segundo antes de verificar novamente
  1.3 - O catch vazio aqui é o que faz o "ignorar erros de rede"
        Se o fetch der erro, ele cai aqui, não faz nada e vai para o setTimeout
*/