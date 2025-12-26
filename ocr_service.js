async function extrairText(url, dbInstancia) {
  console.log("1. Entrou na função extrairText para:", url);
  return new Promise((resolve, reject) => {
    const acesso = dbInstancia.transaction(["paginas"], "readonly");
    const gaveta = acesso.objectStore("paginas");
    const indice = gaveta.index("urlIndex");
    const busca = indice.get(url);

    busca.onsuccess = async () => {
      const registro = busca.result;
      if (!registro) return reject("Imagem nao encontrada no banco");

      console.log("3. Imagem recuperada do banco. Tamanho do Blob:", registro.dados.size);
      //enviar para api.
      const dados = new FormData();
      dados.append("apikey", API_CONFIG.OCR_KEY);
      dados.append("language", "eng");
      dados.append("isOverlayRequired", "true"); // Importante para saber a posição
      dados.append("filetype", "jpg");
      dados.append("file", registro.dados); // O Blob da imagem

      try {
        console.log("4. Enviando para OCR.space... (Aguardando API)");
        const resposta = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          body: dados
        });
        console.log("5. Resposta da rede recebida. Status:", resposta.status);

        const json = await resposta.json();
        console.log("6. JSON da API recebido:", json);

        if (json.OCRExitCode === 1) {
          resolve(json.ParsedResults[0].ParsedText);
        } else {
          reject(json.ErrorMessage || "Erro desconhecido na API");
          console.error("7. API retornou erro interno:", json.ErrorMessage);
        };

      } catch (e) {
        console.error("8. ERRO CRÍTICO no Fetch:", e);
        reject("Erro de rede ao conectar com OCR.space");
      }
    };
  });
};