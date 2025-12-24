/* mini-reactivity-js v0.1 */
(() => {
  'use strict';

  const targetMap = new WeakMap();
  const proxyMap = new WeakMap();
  const getterCache = new Map();
  const setterCache = new Map();
  const callerCache = new Map();
  let activeEffect = null;
  const effectStack = [];

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function cleanup(effectFn) {
    if (!effectFn.deps) return;
    effectFn.deps.forEach(dep => dep.delete(effectFn));
    effectFn.deps.length = 0;
  }

  function effect(fn) {
    const reactiveEffect = () => {
      cleanup(reactiveEffect);
      try {
        effectStack.push(reactiveEffect);
        activeEffect = reactiveEffect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1] || null;
      }
    };
    reactiveEffect.deps = [];
    reactiveEffect();
    return reactiveEffect;
  }

  function track(target, key) {
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
    
  // ---- scheduler mínimo ----
  const jobQueue = new Set();
  let isFlushing = false;
  function queueJob(job) {
    jobQueue.add(job);
    if (!isFlushing) {
      isFlushing = true;
      queueMicrotask(() => {
        try { jobQueue.forEach(fn => fn()); }
        finally { jobQueue.clear(); isFlushing = false; }
      });
    }
  }


  function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    if (!effects) return;
    // effects.forEach(effectFn => effectFn());
    effects.forEach(effectFn => {
      if (effectFn !== activeEffect) { // evita auto-llamarse en caliente
        queueJob(effectFn);
      }
    });
  }

  function reactive(target) {
    if (!isObject(target)) return target;
    const existing = proxyMap.get(target);
    if (existing) return existing;

    const proxy = new Proxy(target, {
      get(obj, key, receiver) {
        const result = Reflect.get(obj, key, receiver);
        track(obj, key);
        if (isObject(result)) {
          return reactive(result);
        }
        return result;
      },
      set(obj, key, value, receiver) {
        const oldValue = obj[key];
        const result = Reflect.set(obj, key, value, receiver);
        if (oldValue !== value) {
          trigger(obj, key);
        }
        return result;
      },
      deleteProperty(obj, key) {
        const hadKey = Object.prototype.hasOwnProperty.call(obj, key);
        const result = Reflect.deleteProperty(obj, key);
        if (hadKey) {
          trigger(obj, key);
        }
        return result;
      }
    });

    proxyMap.set(target, proxy);
    return proxy;
  }

  function createScope(parent, additions = {}) {
    return Object.assign(Object.create(parent || null), additions);
  }

  function getGetter(expr) {
    if (!getterCache.has(expr)) {
      getterCache.set(expr, new Function('scope', `with(scope) { return (${expr}); }`));
    }
    return getterCache.get(expr);
  }

  function getSetter(expr) {
    if (!setterCache.has(expr)) {
      setterCache.set(expr, new Function('scope', 'value', `with(scope) { ${expr} = value; }`));
    }
    return setterCache.get(expr);
  }

  function getCaller(expr) {
    if (!callerCache.has(expr)) {
      callerCache.set(expr, new Function('scope', '$event', `with(scope) { ${expr}; }`));
    }
    return callerCache.get(expr);
  }

  function evalInScope(expr) {
    const getter = getGetter(expr);
    return (scope) => {
      try {
        return getter.call(scope, scope);
      } catch (err) {
        console.warn('[mini-reactivity] Error evaluating expression:', expr, err);
        return undefined;
      }
    };
  }

  function callInScope(expr, scope, event) {
    const caller = getCaller(expr);
    try {
      caller.call(scope, scope, event);
    } catch (err) {
      console.warn('[mini-reactivity] Error executing expression:', expr, err);
    }
  }

  function assignInScope(expr, scope, value) {
    const setter = getSetter(expr);
    try {
      setter.call(scope, scope, value);
    } catch (err) {
      console.warn('[mini-reactivity] Error assigning to expression:', expr, err);
    }
  }

  function processText(node, scope) {
    const template = node.textContent;
    if (!template || template.indexOf('{{') === -1) return;
    const regex = /{{([^}]+)}}/g;

    effect(() => {
      node.textContent = template.replace(regex, (_, expr) => {
        const getter = evalInScope(expr.trim());
        const value = getter(scope);
        return value == null ? '' : value;
      });
    });
  }

  function processBindings(el, scope) {
    [...el.attributes].forEach(attr => {
      const { name, value } = attr;
      if (name.startsWith('r-bind:')) {
        const prop = name.slice(7);
        bindAttribute(el, prop, value, scope);
        el.removeAttribute(name);
      } else if (name.startsWith(':')) {
        const prop = name.slice(1);
        bindAttribute(el, prop, value, scope);
        el.removeAttribute(name);
      } else if (name.startsWith('r-on:')) {
        //const eventName = name.slice(5 + 1);
        const eventName = name.slice(5);
        bindEvent(el, eventName, value, scope);
        el.removeAttribute(name);
      } else if (name.startsWith('@')) {
        const eventName = name.slice(1);
        bindEvent(el, eventName, value, scope);
        el.removeAttribute(name);
      }
    });
  }

  function bindAttribute(el, attrName, expr, scope) {
    const getter = evalInScope(expr);
    effect(() => {
      const value = getter(scope);
      if (value === false || value == null) {
        el.removeAttribute(attrName);
      } else {
        el.setAttribute(attrName, value);
      }
    });
  }

  function bindEvent(el, eventName, expr, scope) {
    const handler = (event) => callInScope(expr, scope, event);
      console.log('addding event', eventName, handler);
    el.addEventListener(eventName, handler);
  }

  function bindModel(el, expr, scope) {
    const getter = evalInScope(expr);
    const setter = (scopeObj, value) => assignInScope(expr, scopeObj, value);

    const updateDom = () => {
      const value = getter(scope);
      if (el.type === 'checkbox') {
        if (Array.isArray(value)) {
          el.checked = value.includes(el.value);
        } else {
          el.checked = !!value;
        }
      } else if (el.type === 'radio') {
        el.checked = value == el.value;
      } else if (el.tagName === 'SELECT' && el.multiple && Array.isArray(value)) {
        Array.from(el.options).forEach(option => {
          option.selected = value.includes(option.value);
        });
      } else {
        el.value = value != null ? value : '';
      }
    };

    effect(updateDom);

    const toState = (event) => {
      if (el.type === 'checkbox') {
        if (el.hasAttribute('value')) {
          const current = getter(scope);
          const checkboxValue = el.value;
          let next;
          if (Array.isArray(current)) {
            next = current.slice();
            const index = next.indexOf(checkboxValue);
            if (el.checked && index === -1) next.push(checkboxValue);
            if (!el.checked && index !== -1) next.splice(index, 1);
          } else {
            next = el.checked ? [checkboxValue] : [];
          }
          setter(scope, next);
        } else {
          setter(scope, !!el.checked);
        }
      } else if (el.type === 'radio') {
        if (el.checked) setter(scope, el.value);
      } else if (el.tagName === 'SELECT' && el.multiple) {
        const selected = Array.from(el.selectedOptions).map(opt => opt.value);
        setter(scope, selected);
      } else {
        setter(scope, event.target.value);
      }
    };

    el.addEventListener('input', toState);
    el.addEventListener('change', toState);
  }

  function handleIf(el, scope) {
    if (!el.hasAttribute('r-if')) return;
    const expr = el.getAttribute('r-if').trim();
    const getter = evalInScope(expr);
    el.removeAttribute('r-if');
    const anchor = document.createComment('r-if');
    const parent = el.parentNode;
    if (!parent) return;
    parent.insertBefore(anchor, el);

    effect(() => {
      const show = !!getter(scope);
      const currentParent = anchor.parentNode;
      if (!currentParent) return;
      if (show) {
        if (el.parentNode !== currentParent) {
          currentParent.insertBefore(el, anchor.nextSibling);
        }
      } else if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  function parseForExpression(expr) {
    const inMatch = expr.match(/^([^\s,]+)(?:\s*,\s*([^\s,]+))?\s+in\s+(.+)$/);
    if (!inMatch) return null;
    const valueAlias = inMatch[1].trim();
    const indexAlias = inMatch[2] ? inMatch[2].trim() : null;
    const sourceExpr = inMatch[3].trim();
    return { valueAlias, indexAlias, sourceExpr };
  }

function handleFor(el, scope) {
  if (!el.hasAttribute('r-for')) return false;
  const expr = el.getAttribute('r-for').trim();
  const parsed = parseForExpression(expr);
  if (!parsed) {
    console.warn('[mini-reactivity] Invalid r-for expression:', expr);
    el.removeAttribute('r-for');
    return false;
  }

  el.removeAttribute('r-for');
  const parent = el.parentNode;
  const anchor = document.createComment('r-for');
  parent.insertBefore(anchor, el);
  parent.removeChild(el);

  const templateEl = el; // este es tu molde
  let blocks = [];
  const getter = evalInScope(parsed.sourceExpr);

  effect(() => {
    const source = getter(scope);
    let entries = [];

    if (Array.isArray(source)) {
      entries = source.map((value, index) => ({ value, key: index }));
    } else if (source instanceof Map) {
      entries = Array.from(source.entries()).map(([key, value]) => ({ value, key }));
    } else if (source && typeof source === 'object') {
      entries = Object.keys(source).map(key => ({ value: source[key], key }));
    }

    // limpiar clones anteriores
    blocks.forEach(block => block.forEach(node => node.remove()));
    blocks = [];

    const frag = document.createDocumentFragment();

    entries.forEach(entry => {
      const childScope = createScope(scope, {
        [parsed.valueAlias]: entry.value
      });
      if (parsed.indexAlias) {
        childScope[parsed.indexAlias] = entry.key;
      }

      // clonar el nodo original completo
      const clone = document.importNode(templateEl, true);
      frag.appendChild(clone);
      processNode(clone, childScope);

      blocks.push([clone]);
    });

    const currentParent = anchor.parentNode;
    if (currentParent) {
      currentParent.insertBefore(frag, anchor.nextSibling);
    }
  });

  return true;
}


  function processNode(node, scope) {
    if (node.nodeType === Node.TEXT_NODE) {
      processText(node, scope);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (handleFor(node, scope)) {
      return;
    }

    handleIf(node, scope);

    if (node.hasAttribute('r-model')) {
      const modelExpr = node.getAttribute('r-model').trim();
      node.removeAttribute('r-model');
      bindModel(node, modelExpr, scope);
    }

    processBindings(node, scope);

    Array.from(node.childNodes).forEach(child => processNode(child, scope));
  }

  function compile(root, state) {
    if (!root) return;
    Array.from(root.childNodes).forEach(child => processNode(child, state));
  }

  function createApp(options = {}) {
    const rawState = options.state || {};
    const methods = options.methods || {};
    const mountedHooks = [];
    if (options.mounted) mountedHooks.push(options.mounted);
    const state = reactive(rawState);

    Object.keys(methods).forEach(name => {
      Object.defineProperty(state, name, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function (...args) {
          return methods[name].apply(state, args);
        }
      });
    });

    return {
      mount(selector) {
        const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!root) {
          throw new Error('[mini-reactivity] Mount target not found');
        }
        compile(root, state);
        
        queueMicrotask(() => {
            root.querySelectorAll('[r-cloak]').forEach(el => el.removeAttribute('r-cloak'));
            root.removeAttribute('r-cloak');
            mountedHooks.forEach(fn => {
                try { fn.call(state, { state, root }); } 
                catch (e) { console.warn('[mini-reactivity] onMounted error:', e); }
            });
        });

          
        return { state };
      },
      state
    };
  }

  window.MiniReactivity = { createApp };
  window.createApp = createApp;
})();
