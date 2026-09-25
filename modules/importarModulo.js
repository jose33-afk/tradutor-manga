/** 
* Dynamically imports a module by its extension-relative path
* @param {string} fileName - Extension-relative path to the module file. Example: 'modules/eventManager.js'.
* @param {string|null} [objname=null] - Name of the export to retrieve, as string. Example: 'EventManager'
* @returns {Promise<Object|Function|null>} The requested export, or the whole module, or null on error.
*/

globalThis.importModule = async function(fileName, objname = null) {
  try {
    const path = chrome.runtime.getURL(fileName);
    const loadedModule = await import(path);

    if (objname) {
      if (!(objname in loadedModule)) {
        console.warn(`Warning: ${objname} was not exported from ${fileName}.`);
      }
      return loadedModule[objname];
    }
    return loadedModule;
  } catch(e) {
    console.error(`Critical failure while loading ${fileName}`, e);
    return null;
  }
};