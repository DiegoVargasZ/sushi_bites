"use strict";

// Each click has its own key: simultaneous tabs never overwrite one another.
// The previous cart is a read-only baseline, so existing bags are preserved.
const cartStore = (() => {
  const legacyKey = "sushi-bites-cart-menu-v2";
  const prefix = "sushi-bites-cart-menu-v3:change:";
  const ids = new Set(products.map(product => product.id));
  const pending = new Map();
  let lastTime = 0;
  let baseline = {};
  const clamp = quantity => Math.max(0, Math.min(99, quantity));

  function read() {
    const changes = new Map(pending);
    try {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(legacyKey) || "{}"); }
      catch { saved = {}; }
      baseline = {};
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const id of ids) if (Number.isInteger(saved[id]) && saved[id] > 0) baseline[id] = clamp(saved[id]);
      }
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(prefix)) continue;
        try {
          const change = JSON.parse(localStorage.getItem(key));
          if (change && ids.has(change.id) && [1, -1].includes(change.delta) && Number.isSafeInteger(change.time) && change.time >= 0) changes.set(key, change);
        } catch { /* Ignore a damaged record without discarding the rest. */ }
      }
    } catch { /* Keep the bag usable when browser storage is blocked. */ }
    const cart = {...baseline};
    const ordered = [...changes].sort(([aKey, a], [bKey, b]) => a.time - b.time || (aKey < bKey ? -1 : aKey > bKey ? 1 : 0));
    for (const [, change] of ordered) {
      lastTime = Math.max(lastTime, change.time);
      const quantity = clamp((cart[change.id] || 0) + change.delta);
      if (quantity) cart[change.id] = quantity;
      else delete cart[change.id];
    }
    return cart;
  }

  function change(id, delta) {
    const cart = read();
    if (!ids.has(id) || ![1, -1].includes(delta) || clamp((cart[id] || 0) + delta) === (cart[id] || 0)) return cart;
    const unique = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const key = prefix + unique;
    const operation = {id, delta, time: Math.max(Date.now(), lastTime + 1)};
    try { localStorage.setItem(key, JSON.stringify(operation)); }
    catch { pending.set(key, operation); }
    return read();
  }

  return {read, change, handles: key => key === null || key === legacyKey || key.startsWith(prefix)};
})();
