# mini-reactivity-js

Framework reactivo diminuto para HTML sin dependencias externas. Está pensado para proyectos pequeños, demos o prototipos donde se quiere una capa mínima de reactividad sobre el DOM.

## Características

- **Interpolación** con `{{ expr }}` en nodos de texto.
- **Two-way binding** con `r-model="path"` (soporta `input`, `select`, `textarea`, `checkbox` y `radio`).
- **Atributos dinámicos** con `r-bind:attr="expr"` o su atajo `:attr="expr"`.
- **Render condicional** mediante `r-if="expr"`, que inserta o elimina nodos del DOM.
- **Listas** usando `r-for` sobre `<template>`: `r-for="item, i in items"`.
- **Eventos declarativos** con `r-on:event="expr"`, por ejemplo `r-on:click="increment()"`.
- Estado reactivo y expresiones evaluadas en el contexto de `state` para una sintaxis natural.

> **Aviso**: No evalúes expresiones provenientes de usuarios. Las expresiones se ejecutan vía `with(state)` y podrían comprometer la seguridad si provienen de entradas externas.

## Instalación

1. Copia `minir.js` dentro de tu proyecto.
2. Inclúyelo en tu HTML antes de tu script principal:

```html
<script src="./minir.js"></script>
<script>
  // aquí tu lógica de arranque
</script>
```

También puedes abrir `example.html` directamente en el navegador para ver un ejemplo funcional.

## Uso rápido

1. Define tu estado inicial y las funciones que necesites.
2. Llama a `createApp({ state, methods }).mount(el)` con el contenedor raíz.

```html
<div id="app">
  <h1>{{ title }}</h1>
  <input r-model="form.name" placeholder="Tu nombre" />
  <p>Hola, {{ form.name || 'anónimo' }}.</p>
  <button r-on:click="toggle()">Alternar saludo</button>
  <p r-if="showGreeting">¡Bienvenido!</p>
</div>

<script src="./minir.js"></script>
<script>
  const app = createApp({
    state: {
      title: 'Mini Reactivity',
      form: { name: '' },
      showGreeting: true,
    },
    methods: {
      toggle() {
        this.showGreeting = !this.showGreeting;
      },
    },
  });

  app.mount('#app');
</script>
```

## Conceptos clave

- **Estado reactivo**: cualquier propiedad definida en `state` se convierte en reactiva. Las asignaciones directas actualizan el DOM automáticamente.
- **Paths profundos**: `r-model` y las expresiones aceptan rutas como `user.profile.email`.
- **Métodos**: se ejecutan con `this` apuntando al estado proxy, lo que permite mutar propiedades directamente.
- **Eventos**: pueden recibir el evento actual como `$event` en las expresiones (`r-on:input="onInput($event.target.value)"`).

## Desarrollo

- El proyecto es deliberadamente pequeño: el núcleo está en [`minir.js`](./minir.js).
- No requiere tooling. Basta con abrir el HTML en el navegador.

## Licencia

MIT. Utilízalo y modifícalo libremente en tus proyectos.
