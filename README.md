# Manga & Webcomic Translator (Browser Extension)

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento_(WIP)-orange.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Chrome_|_Edge_|_Brave-lightgrey.svg)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)

Uma extensão de navegador de alta performance, atualmente em desenvolvimento, desenhada para detetar, extrair e traduzir balões de texto de webcomics, mangás e manhwas em tempo real. 

Com suporte nativo a múltiplos idiomas de origem (Inglês, Espanhol, Francês, Japonês, Coreano, etc.), o projeto está a ser construído com uma arquitetura **100% Client-Side**. O foco absoluto é a otimização de memória (prevenção de memory leaks) e eliminação de custos de infraestrutura (Zero-Cost Architecture).

---

## 🎯 O Desafio de Engenharia
Tradutores de ecrã tradicionais dependem de servidores pesados para processar imagens, gerando latência e custos. Além disso, costumam "queimar" o texto traduzido na imagem, destruindo a arte original. 

Este projeto resolve esses problemas trazendo o processamento visual (Canvas API) e o OCR para o hardware do próprio utilizador, mantendo a integridade da obra original através de injeção dinâmica de DOM.

---

## ✨ Funcionalidades Principais (Em Implementação)

* **Renderização Não Destrutiva (DOM Overlay):** O sistema calcula a posição absoluta e a proporção da imagem na tela (scroll-offset), injetando caixas de texto flutuantes (HTML/CSS) milimetricamente sobre os balões originais, sem alterar o ficheiro da imagem.
* **Comunicação Cross-World & Suporte a SPAs:** Para suportar sites dinâmicos (Single Page Applications), a extensão injeta fisicamente um script no *Main World* do site para intercetar a `History API` (`pushState`/`replaceState`), comunicando com o *Isolated World* da extensão via `CustomEvents`.
* **Processamento Matemático de Imagens (Front-end):** Extração de imagens diretamente do DOM e aplicação de algoritmos de *Thresholding* (Binarização) na **Canvas API** para limpar texturas, entregando imagens otimizadas para o motor de OCR.
* **Estratégia Anti-CORS e Fallback:** Requisições otimizadas que tentam capturar o `blob` da imagem via `fetch` e, em caso de bloqueio de rede ou CORS, ativam um *fallback* imediato que captura os pixels diretamente da imagem renderizada na tela.

---

## 🏗️ Visão Geral da Arquitetura

O ecossistema é modular e separa rigorosamente as responsabilidades:

1. **`injetor.js` (Main World):** O "espião" injetado na página hospedeira para monitorizar navegações silenciosas.
2. **`content.js` & `filtro.js` (Isolated World):** Observador visual com varredura *on-scroll*. Interceta o carregamento do DOM, comprime Blobs localmente e organiza as filas de imagens. Inclui gestão manual de *Garbage Collection* (`URL.revokeObjectURL`) para evitar que a RAM esgote durante a leitura.
3. **`background.js` (Service Worker):** O maestro assíncrono. Gere o acesso ao `IndexedDB`, as validações de esquema e prepara o terreno para delegar tarefas de OCR sem bloquear a *Main Thread* da página.
4. **Armazenamento Desacoplado:** Utiliza `IndexedDB` (`MangaCache`) para persistir metadados posicionais e lotes estruturados, desenhado para funcionar sem backend.

---

## 🚧 Status Atual e Próximos Passos

O projeto encontra-se em desenvolvimento ativo. No momento, o esforço principal não está na criação de novas funcionalidades, mas sim na melhoria contínua da arquitetura e qualidade do código existente (Technical Debt).

Focos atuais:
* **Refatoração para Orientação a Objetos (OOP):** Migrando a estrutura de módulos base para um design baseado em Classes. O objetivo é garantir um melhor encapsulamento da lógica, facilitando a manutenção e a escalabilidade do pipeline.
* **Reorganização de Módulos:** Limpeza e estruturação da base de código para garantir o Princípio de Responsabilidade Única (SOLID), separando claramente as lógicas de interface, gerenciamento de eventos e chamadas de API.
* **Estabilidade e Manutenibilidade:** Preparando o terreno e organizando a base do código para, futuramente, suportar a expansão de novas features de forma segura e sem quebrar as integrações já construídas.

---

## 🚀 Tecnologias Utilizadas

* **Linguagem:** JavaScript Vanilla (ES6+) moderno (`async/await`, `Promise.all`).
* **Ecossistema:** Chrome Extension API (Manifest V3 - Service Workers, Storage, Scripting).
* **Armazenamento:** `IndexedDB` nativo e `chrome.storage`.
* **Processamento Visual:** HTML5 Canvas API, `FileReader` e Blob Management.

---

## 📝 Licença

Distribuído sob a licença **GNU AGPL-3.0**. O uso livre, a modificação e a distribuição são permitidos, desde que o código fonte derivado também seja mantido aberto sob a mesma licença.
