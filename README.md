# mini-reactivity-js


Pequeño framework reactivo para HTML sin dependencias. Proporciona:


- `{{ expr }}` — Interpolación en nodos de texto.
- `r-model="path"` — Two-way binding para inputs (soporta checkbox/radio).
- `r-bind:attr="expr"` / `:attr="expr"` — Atributos dinámicos.
- `r-if="expr"` — Render condicional (inserta/extrae del DOM).
- `r-for` en `<template>` — Iteración: `r-for="item, i in items"`.
- `r-on:event="expr"` — Eventos declarativos (p.ej. `r-on:click`, `r-on:input`).


> **Aviso**: No evalúes expresiones provenientes de usuarios. Las expresiones se ejecutan vía `with(state)`.


## Instalación


Copia `mini-reactivity.js` y referéncialo en tu HTML:


```html
<script src="./mini-reactivity.js"></script>
