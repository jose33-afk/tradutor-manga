// preview.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "RENDER_PREVIEW") {
    const root = document.getElementById('preview-root');
    
    // Limpa o root caso já tenha algo (evita duplicados se reenviar)
    root.innerHTML = '';

    request.data.forEach(lote => {
      // 1. Cria o container do lote
      const container = document.createElement('div');
      container.className = 'lote-container';

      // 2. Cria a imagem
      const img = document.createElement('img');
      
      // AQUI ESTÁ O QUE VOCÊ PERGUNTOU:
      // Não usamos mais o Blob aqui, usamos a URL que você já criou no loop principal
      img.src = lote.previewUrl; 

      // 3. Cria a bordinha de info (opcional, mas ajuda a debugar)
      const info = document.createElement('div');
      info.className = 'lote-info';
      info.innerText = `Lote ID: ${lote.id} | Imagens: ${lote.totalImagens}`;

      // 4. Monta a estrutura no HTML
      container.appendChild(info);
      container.appendChild(img);
      root.appendChild(container);
    });
  }
});