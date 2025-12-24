# mini-reactivity-js

Framework reactivo diminuto para HTML sin dependencias externas. Está pensado para proyectos pequeños, demos o prototipos donde se quiere una capa mínima de reactividad sobre el DOM.

## Características

- **Interpolación** con `{{ expr }}` en nodos de texto.
- **Two-way binding** con `r-model="path"` (soporta `input`, `select`, `textarea`, `checkbox` y `radio`).
- **Atributos dinámicos** con `r-bind:attr="expr"` o su atajo `:attr="expr"`.
- **Render condicional** mediante `r-if="expr"`, que inserta o elimina nodos del DOM.
- **Listas** usando `r-for` sobre `<template>`: `r-for="item, i in items"` (también soporta objetos y mapas con clave y valor).
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

## Ejemplos por funcionalidad

> Todas las expresiones se evalúan en el contexto de `state`, así que no necesitas prefijos para acceder a los datos. Las muestras asumen que ya inicializaste la app con `createApp({ state, methods }).mount(...)`.

### Interpolación de texto

```html
<p>Hola, {{ user.name || 'invitado' }}.</p>
```

Cuando `user.name` cambie, el nodo de texto se actualiza automáticamente sin tocar el DOM manualmente.

### Two-way binding (`r-model`)

```html
<input r-model="form.email" placeholder="Correo" />
<label>
  <input type="checkbox" r-model="prefs.newsletter" /> Suscribirme al boletín
</label>
```

Los inputs mantienen sincronizado el estado: escribir en el campo modifica `form.email` y marcar/desmarcar cambia `prefs.newsletter`. Si actualizas esas propiedades desde código, el valor del input también se refleja.

### Atributos dinámicos (`r-bind` / `:`)

```html
<img :src="profile.avatar" :alt="'Avatar de ' + profile.name" :width="size" />
<a r-bind:href="links.twitter" target="_blank">Twitter</a>
```

Los atributos se recalculan cuando cambia el estado. Si el valor es `false`, `null` o `undefined`, el atributo se elimina.

### Render condicional (`r-if`)

```html
<p r-if="isLoggedIn">Bienvenido de nuevo, {{ user.name }}.</p>
<p r-if="!isLoggedIn">Por favor inicia sesión.</p>
```

El nodo se inserta o elimina del DOM según la expresión booleana. No deja contenedores vacíos.

### Listas (`r-for` sobre `<template>`)

```html
<ul>
  <template r-for="todo, i in todos">
    <li>
      <input type="checkbox" r-model="todo.done" />
      {{ i + 1 }}. {{ todo.text }}
    </li>
  </template>
</ul>
```

Cada ítem del arreglo se renderiza a partir del `<template>` original. Puedes usar alias de valor (`todo`) e índice (`i`).

Para objetos o `Map`, el segundo alias te da la clave:

```html
<ul>
  <template r-for="value, key in options">
    <li>{{ key }}: {{ value }}</li>
  </template>
</ul>
```

### Eventos declarativos (`r-on` / `@`)

```html
<button r-on:click="increment()">Suma</button>
<form r-on:submit="save($event); $event.preventDefault()">
  <input r-model="form.name" />
  <button type="submit">Guardar</button>
</form>
```

Las expresiones se ejecutan con `this` apuntando al estado. `$event` te da acceso al evento nativo para evitar envíos o leer valores.

### Hooks de montaje (`mounted`)

```js
const app = createApp({
  state: { ready: false },
  mounted({ state }) {
    state.ready = true;
  }
});

app.mount('#app');
```

La función `mounted` se llama después de procesar el DOM y de quitar `r-cloak`, ideal para inicializaciones que dependan de los nodos renderizados.

## Desarrollo

- El proyecto es deliberadamente pequeño: el núcleo está en [`minir.js`](./minir.js).
- No requiere tooling. Basta con abrir el HTML en el navegador.

## Licencia

MIT. Utilízalo y modifícalo libremente en tus proyectos.
