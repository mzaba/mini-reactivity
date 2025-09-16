/* mini-reactivity-js v0.1 */
const expr = el.getAttribute('r-if').trim();
el.removeAttribute('r-if');
const anchor = document.createComment('r-if');
const parent = el.parentNode;
parent.insertBefore(anchor, el);
effect(() => {
let show = false;
try {
const fn = evalInScope(expr);
show = !!fn(scope);
} catch {}
if (show) { if (!el.isConnected) parent.insertBefore(el, anchor.nextSibling); }
else { if (el.isConnected) el.remove(); }
});
});


// r-on dentro del fragment (usa scope extendido y $event)
fragment.querySelectorAll('*').forEach(el => {
[...el.attributes].forEach(attr => {
if (!attr.name.startsWith('r-on:')) return;
const eventName = attr.name.slice(5 + 1);
const expr = attr.value.trim();
const handler = (ev) => callInScope(expr, scope, ev);
el.addEventListener(eventName, handler);
el.removeAttribute(attr.name);
});
});


// r-model dentro del fragment (escribe sobre state original)
fragment.querySelectorAll('[r-model]').forEach(el => {
const path = el.getAttribute('r-model').trim();
el.removeAttribute('r-model');
const updateDom = () => {
const v = getByPath(state, path);
if (el.type === 'checkbox') el.checked = !!v;
else if (el.type === 'radio') el.checked = el.value == v;
else el.value = v ?? '';
};
effect(updateDom);
const toState = () => {
if (el.type === 'checkbox') setByPath(state, path, !!el.checked);
else if (el.type === 'radio') { if (el.checked) setByPath(state, path, el.value); }
else setByPath(state, path, el.value);
};
el.addEventListener('input', toState);
el.addEventListener('change', toState);
});
}
}


/* ------------------ API ------------------ */
function createApp(options) {
const state = reactive(options.state || {});
return {
mount(selector) {
const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
compile(root, state);
return { state };
},
state
};
}


// Exponer en window
window.MiniReactivity = { createApp };
})();
