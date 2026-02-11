import { azureConfig } from "./config.js";

export async function testeAzure(blob) {
  // A URL para o OCR de leitura (Read API)
  console.log("Tipo do Blob:", blob.type)
  console.log(blob)
  const url = `${azureConfig.endpoit}vision/v3.2/read/analyze`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureConfig.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: blob
    });

    if (response.status === 202) {
      console.log('Sucesso! Imagem aceita. Consultando resultado...');
      const linkEspera = response.headers.get('Operation-Location');

      const resultado = await vigiarLink(linkEspera, azureConfig.apiKey);

      if (resultado.sucesso) console.log("Aqui está o seu texto:", resultado.texto);
      else {
        console.error("azure aceitou, mas houve um problema:", resultado.erro);
      };

    } else {
      console.log("Erro na requisao:", response.status);
    };

  } catch(e) {
    console.log("Erro na requisicao:", e);
  };
};

async function vigiarLink(link) {
  const tempoMaximoTentativa = 30000 // 30s de limite para imagens gigantes
  const inicio = Date.now();

  while ( Date.now() - inicio < tempoMaximoTentativa) {
    try {
      const response = await fetch(link, {
        headers: { 'Ocp-Apim-Subscription-Key': azureConfig.apiKey }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'succeeded'){
          return {
            sucesso: true,
            texto: dados.analyzeResult?.readResults?.[0]?.lines || []
          };
        };
        
        if (data.status === 'failed') {
          return { sucesso: false, erro:"Azure falhou no processamento" };
        };
      } else {
        console.warn(`Servidor respondeu com erro ${response.status}, tentando novamente...`);
      };

      // Espera 1 segundo antes de verificar novamente
      await new Promise(resolv => setTimeout(resolv, 1000));
    } catch (e) {
      console.error("Erro de conexao durante a espera:", e.message);
    };
  };

  // Se sair do while, é porque o tempo estourou
  return { sucesso: false, erro: "Tempo esgotado (Timeout de 30s)" };
};