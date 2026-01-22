document.getElementById('btnLigar').addEventListener('click', async () => {
  await chrome.storage.local.set({
    ligado: true,
    estaCorrendo: true
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id);
    window.close();
  });
});