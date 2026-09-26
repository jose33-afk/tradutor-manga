/** 
* Dynamically imports a module by its extension-relative path
* @param {string} fileName - Extension-relative path to the module file. Example: 'modules/eventManager.js'.
* @param {string|null} [objname=null] - Name of the export to retrieve, as string. Example: 'EventManager'
* @returns {Promise<Object|Function|null>} The requested export, or the whole module, or null on error.
*/

function matchUrl(url, pattern) {
  if (pattern === '<all_urls>') return true;

  const m = pattern.match(/^(\*|https?|file|ftp):\/\/([^\/]*)(\/.*)$/);
  console.log(m)

  // eu parei aqui: estava fazendo essa funcao para validar se o site e permitido de usar 
  // determinada exportacao. Hoje nao uso mas caso queira proibir no futuro..
}

globalThis.importModule = async function(fileName, objname = null) {
  try {
    const normalized = fileName.replace(/^\.\//, '');
    const manifest = chrome.runtime.getManifest();
    const war = manifest.web_accessible_resources || [];

    if (!'web_accessible_resources' in manifest || war.length === 0) {
      throw new Error(
        `'web_accessible_resources' is missing or empty in manifest.json.
         Add this property before using importModule().`
      );
    }

   console.log(war)

    // if (!('content_scripts' in manifest)) {
    //   console.warn(`
    //     Con
    //   `);
    // }
    //   // const path = chrome.runtime.getURL(fileName);
      // const loadedModule = await import(path);

      // if (objname) {
      //   if (!(objname in loadedModule)) {
      //     console.warn(`Warning: ${objname} was not exported from ${fileName}.`);
      //   }
        
      //   return loadedModule[objname];
      // }
      // return loadedModule;
  } catch(e) {
    console.error(`Critical failure while loading ${fileName}: `, e);
    return null;
  }
};

importModule('./modules/eventManager.js', 'eventManager')


/*
  1.1-a - If location doesn't even exist, it's because it's in the service worker. 
          A service worker doesn't have location. In that case, it's extencion context → true.
  1.1-b - Se location nem existe, é porque tá no service worker. Service worker não tem location. 
          Nesse caso, é contexto de extensão → true.
*/