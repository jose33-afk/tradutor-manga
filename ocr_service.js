async function extrairText(url, dbInstancia) {
  return new Promise((resolve, reject) => {
    const acesso = dbInstancia.transaction(["paginas"], "readonly");
    const gaveta = acesso.objectStore("paginas");
    const indice = gaveta.index("urlIndex");
    const busca = indice.get(url);

    busca.onsuccess = async () => {
      const registro = busca.result;
      if (!registro) return reject("Imagem nao encontrada no banco");

      //config api.
      let imgBlob = registro.dados;
      let typeImg = imgBlob.type.split('/')[1] || "jpg";
      if (typeImg === "jpeg") typeImg = "jpg";

      const dados = new FormData();
      dados.append("apikey", API_CONFIG.OCR_KEY);
      dados.append("language", "eng");
      dados.append("isOverlayRequired", "true"); // Importante para saber a posição
      dados.append("filetype", typeImg);
      dados.append("file", imgBlob, `manga_page.${typeImg}`);

      // try {
      //   console.log("4. Enviando para OCR.space... (Aguardando API)");
      //   const resposta = await fetch("https://api.ocr.space/parse/image", {
      //     method: "POST",
      //     body: dados
      //   });
      //   console.log("5. Resposta da rede recebida. Status:", resposta.status); //REMOVER SOMENTE TESTE

      //   const json = await resposta.json();
      //   console.log("6. JSON da API recebido:", json); //REMOVER SOMENTE TESTE

      //   if (json.OCRExitCode === 1) {
      //     resolve(json.ParsedResults[0].ParsedText);
      //   } else {
      //     reject(json.ErrorMessage || "Erro desconhecido na API");
      //     console.error("7. API retornou erro interno:", json.ErrorMessage); //REMOVER SOMENTE TESTE
      //   };

      // } catch (e) {
      //   console.error("8. ERRO CRÍTICO no Fetch:", e); //REMOVER SOMENTE TESTE
      //   reject("Erro de rede ao conectar com OCR.space");
      // }
    };
  });
};