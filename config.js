const azureConfig = {
  apiKey: "2Drf7fJ6aEwOSJxy5vQmqZxRGgP9rgOULo7cf9OOygK3OnxsNE7BJQQJ99CBACYeBjFXJ3w3AAAFACOGyg62",
  endpoint: "https://ocr-manga-reader-translator.cognitiveservices.azure.com/",
  limits: {
    maxCallsPerMinute: 20, 
    monthlyQuota: 500,
  },
};

globalThis.azureConfig = azureConfig;