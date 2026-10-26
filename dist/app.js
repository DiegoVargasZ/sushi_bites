"use strict";

const storageKey = "sushi-bites-cart-menu-v2";
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    for (const p of products) if (Number.isInteger(saved[p.id]) && saved[p.id]>0) cart[p.id]=Math.min(saved[p.id],99);
  }
} catch { /* The cart still works when browser storage is unavailable. */ }
const money = value => `Bs ${new Intl.NumberFormat("es-BO",{minimumFractionDigits:value%1?2:0,maximumFractionDigits:2}).format(value)}`;
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const photo = p => `<img src="${p.photo}" alt="${p.name}" width="360" height="360" loading="lazy" decoding="async">`;
const menuGrid = document.querySelector("#menu-grid");
const cartDialog = document.querySelector(".cart-dialog");
const productDialog = document.querySelector(".product-dialog");
const cartBody = document.querySelector("#cart-items");
const checkoutForm=document.querySelector("#cart-checkout");
const branchSelect=document.querySelector("#order-branch");
const deliveryFields=document.querySelector("#delivery-fields");
const addressInput=document.querySelector("#delivery-address");
const referenceInput=document.querySelector("#delivery-reference");
const notesInput=document.querySelector("#order-notes");
const orderSessionKey="sushi-bites-order-session-v1";
for(const branch of orderBranches){const option=document.createElement("option");option.value=branch.id;option.textContent=branch.name;branchSelect.append(option);}
try{
  const saved=JSON.parse(sessionStorage.getItem(orderSessionKey)||"{}");
  if(saved&&typeof saved==="object"){
    if(orderBranches.some(b=>b.id===saved.branch))branchSelect.value=saved.branch;
    if(["delivery","pickup"].includes(saved.fulfillment))checkoutForm.querySelector(`[name="fulfillment"][value="${saved.fulfillment}"]`).checked=true;
    for(const [input,key] of [[addressInput,"address"],[referenceInput,"reference"],[notesInput,"notes"]])if(typeof saved[key]==="string")input.value=saved[key].slice(0,input.maxLength);
    deliveryLocation.restore(saved.location);
  }
}catch{/* Session preferences are optional. */}
function invalidatePreparedOrder(){
  document.querySelector("#whatsapp-ready").hidden=true;
  document.querySelector("#whatsapp-order-link").removeAttribute("href");
  document.querySelector("#copy-fallback").hidden=true;
  document.querySelector("#order-summary").value="";
}
function syncFulfillment(){
  const method=checkoutForm.querySelector('[name="fulfillment"]:checked')?.value;
  const delivery=method==="delivery";
  deliveryFields.hidden=!delivery;
  deliveryFields.disabled=!delivery;
  addressInput.required=delivery;
  deliveryLocation.setEnabled(delivery&&cartDialog.open&&!checkoutForm.hidden,branchSelect.value);
  const branch=orderBranches.find(b=>b.id===branchSelect.value);
  document.querySelector("#order-branch-info").textContent=branch?`${method==="pickup"?"Recoges en: ":""}${branch.address} · WhatsApp +${branch.phone}`:"Tu pedido irá al WhatsApp de la sucursal que elijas.";
  document.querySelector("#order-cost-note").textContent=delivery?"Costo y zona de delivery por confirmar con la sucursal. No incluidos en el subtotal.":"Disponibilidad y total final por confirmar con la sucursal.";
}
function saveOrderPreferences(){
  const fulfillment=checkoutForm.querySelector('[name="fulfillment"]:checked')?.value||"";
  try{sessionStorage.setItem(orderSessionKey,JSON.stringify({fulfillment,branch:branchSelect.value,address:addressInput.value,reference:referenceInput.value,notes:notesInput.value,location:deliveryLocation.getPoint()}));}catch{/* The form still works without storage. */}
}
checkoutForm.addEventListener("input",event=>{
  event.target.setCustomValidity?.("");
  invalidatePreparedOrder();syncFulfillment();saveOrderPreferences();
});
document.addEventListener("deliverylocationchange",()=>{invalidatePreparedOrder();saveOrderPreferences();});
cartDialog.addEventListener("close",()=>deliveryLocation.setEnabled(false));
syncFulfillment();
const tabs = [...document.querySelectorAll("[data-category]")];
let toastTimer;
let selectedCategory="all";
const searchInput=document.querySelector("#menu-search");
const normalizeSearch=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
for(const tab of tabs){const count=products.filter(p=>tab.dataset.category==="all"||p.category===tab.dataset.category).length;tab.querySelector("span").textContent=String(count).padStart(2,"0");}
searchInput?.addEventListener("input",()=>renderMenu(selectedCategory));
document.querySelector("#clear-search")?.addEventListener("click",()=>{searchInput.value="";renderMenu(selectedCategory);searchInput.focus();});

function notify(message) {
  const toast = document.querySelector(".toast");
  toast.textContent=message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("visible"),3200);
}

function renderMenu(category="all") {
  if(!menuGrid)return;
  const query=normalizeSearch(searchInput.value.trim());
  const filtered=products.filter(p=>(category==="all"||p.category===category)&&(!query||normalizeSearch(`${p.name} ${p.description} ${p.meta}`).includes(query)));
  document.querySelector("#menu-results").textContent=`${filtered.length} ${filtered.length===1?"opción":"opciones"}${query?" para tu búsqueda":" para tu antojo"}`;
  document.querySelector("#clear-search").hidden=!query;
  let previousCategory="";
  menuGrid.innerHTML=filtered.map((p,i)=>{
    let heading="";
    if(category==="all"&&previousCategory!==p.category){const group=menuCategories.find(c=>c.id===p.category);heading=`<div class="menu-group-heading"><div><span class="eyebrow">${String(menuCategories.indexOf(group)+1).padStart(2,"0")} / LA CARTA</span><h3>${group.name}</h3></div><p>${group.description}</p></div>`;previousCategory=p.category;}
    return `${heading}<article class="product-card" style="animation-delay:${Math.min(i,8)*35}ms">
      <button class="product-picture" data-detail="${p.id}" aria-label="Ver detalles de ${p.name}">
        ${photo(p)}${p.badge?`<span class="product-badge">${p.badge}</span>`:""}
      </button>
      <div class="product-info"><p class="product-meta">${p.meta} · ${p.serving}</p>
        <div class="product-title-row"><h3>${p.name}</h3><span>${money(p.price)}</span></div>
        <p class="product-description">${p.description}</p>
        <div class="product-card-bottom"><button class="ingredient-button" data-detail="${p.id}" aria-label="Ver ingredientes de ${p.name}">Ver ingredientes ↗</button><button class="add-button" data-add="${p.id}" aria-label="Añadir ${p.name} al pedido">Añadir<span>${icon("plus")}</span></button></div>
      </div>
    </article>`;}).join("")||`<div class="menu-empty"><span>⟡</span><h3>No encontramos ese antojo.</h3><p>Prueba con «salmón», «pollo» o «mochi», o elige otra categoría.</p></div>`;
}

function selectTab(tab,focus=false) {
  selectedCategory=tab.dataset.category;
  for(const t of tabs) {
    const selected=t===tab;
    t.setAttribute("aria-selected",String(selected));
    t.tabIndex=selected?0:-1;
  }
  menuGrid.setAttribute("aria-labelledby",tab.id);
  renderMenu(tab.dataset.category);
  if(focus)tab.focus();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener("click",()=>selectTab(tab));
  tab.addEventListener("keydown",event=>{
    let next;
    if(event.key==="ArrowRight") next=(index+1)%tabs.length;
    if(event.key==="ArrowLeft") next=(index-1+tabs.length)%tabs.length;
    if(event.key==="Home") next=0;
    if(event.key==="End") next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectTab(tabs[next],true);tabs[next].scrollIntoView({block:"nearest",inline:"nearest"});}
  });
});

function updateCart() {
  const entries=products.filter(p=>cart[p.id]);
  const count=entries.reduce((n,p)=>n+cart[p.id],0);
  const total=entries.reduce((n,p)=>n+cart[p.id]*p.price,0);
  const badge=document.querySelector(".cart-count");
  badge.hidden=count===0;
  badge.textContent=count>99?"99+":count;
  document.querySelector(".cart-toggle").setAttribute("aria-label",`Abrir mi pedido${count?`, ${count} ${count===1?"producto":"productos"}`:""}`);
  document.querySelector("#cart-checkout").hidden=!entries.length;
  syncFulfillment();
  document.querySelector("#cart-total").textContent=money(total);
  invalidatePreparedOrder();
  if(!entries.length) {
    cartBody.innerHTML=`<div class="empty-cart">${icon("bag")}<h3>El comienzo de algo rico.</h3><p>Tu bolsa aún está vacía. Encuentra tu roll favorito y deja que el antojo decida.</p><button class="button" data-explore>Explorar la carta ${icon("arrow")}</button></div>`;
  } else {
    cartBody.innerHTML=entries.map(p=>`<article class="cart-item"><div class="cart-item-photo">${photo(p)}</div><div><h3>${p.name}</h3><p class="item-subtitle">${p.serving} · ${money(p.price)}</p><div class="quantity-control"><button data-quantity="${p.id}" data-delta="-1" aria-label="${cart[p.id]===1?"Quitar":"Restar una unidad de"} ${p.name}">−</button><span aria-label="Cantidad de ${p.name}: ${cart[p.id]}">${cart[p.id]}</span><button data-quantity="${p.id}" data-delta="1" aria-label="Sumar una unidad de ${p.name}" ${cart[p.id]>=99?"disabled":""}>+</button></div></div><strong>${money(p.price*cart[p.id])}</strong></article>`).join("");
  }
  try {localStorage.setItem(storageKey,JSON.stringify(cart));} catch { /* Storage is optional. */ }
}

function addProduct(id) {
  const p=products.find(p=>p.id===id);
  if(!p)return;
  if((cart[id]||0)>=99){notify("Has llegado al máximo de 99 unidades por producto.");return;}
  cart[id]=(cart[id]||0)+1;
  updateCart();
  notify(`${p.name} añadido a tu pedido. Buen gusto.`);
}

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("modal-open");
  if(dialog===cartDialog)syncFulfillment();
}
function closeDialog(dialog) {dialog.close();}
for(const dialog of [cartDialog,productDialog]) {
  dialog.addEventListener("close",()=>{if(!document.querySelector("dialog[open]"))document.body.classList.remove("modal-open");});
  dialog.addEventListener("click",event=>{
    if(event.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog(dialog);
  });
}

function showProduct(id) {
  const p=products.find(p=>p.id===id);
  if(!p)return;
  document.querySelector("#product-detail").innerHTML=`<div class="detail-image">${photo(p)}</div><div class="detail-copy"><p class="product-meta">${p.meta} · ${p.serving}</p><h2 id="product-title">${p.name}</h2><p>${p.description}</p><h3>Alérgenos a consultar</h3><div class="allergens">${p.allergens.length?p.allergens.map(a=>`<span>${a}</span>`).join(""):"<span>Consultar composición con el restaurante</span>"}</div><p class="allergen-note">Orientación según los ingredientes descritos; no es una ficha de alérgenos certificada. Las salsas y los ingredientes pueden variar. Si tienes una alergia, consulta con el restaurante antes de pedir. Puede existir contacto cruzado.</p><div class="detail-bottom"><strong>${money(p.price)}</strong><button class="button" data-add="${p.id}" data-add-detail>Añadir a mi pedido ${icon("plus")}</button></div></div>`;
  openDialog(productDialog);
}

document.addEventListener("click",event=>{
  const target=event.target.closest("button");
  if(!target)return;
  if(target.dataset.add){addProduct(target.dataset.add);if(target.hasAttribute("data-add-detail"))closeDialog(productDialog);}
  if(target.dataset.detail)showProduct(target.dataset.detail);
  if(target.hasAttribute("data-close-cart"))closeDialog(cartDialog);
  if(target.hasAttribute("data-close-product"))closeDialog(productDialog);
  if(target.hasAttribute("data-explore")){closeDialog(cartDialog);const carta=document.querySelector("#carta");if(carta)carta.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});else location.href="menu.html";}
  if(target.dataset.quantity) {
    const id=target.dataset.quantity;
    const delta=Number(target.dataset.delta);
    const next=Math.max(0,Math.min(99,(cart[id]||0)+delta));
    if(next===0)delete cart[id];else cart[id]=next;
    updateCart();
    // Rendering replaces the stepper; restore its keyboard focus.
    const replacement=cartBody.querySelector(`[data-quantity="${id}"][data-delta="${delta}"]`);
    if(replacement)replacement.focus({preventScroll:true});else cartDialog.querySelector("[data-close-cart]").focus({preventScroll:true});
  }
});
document.querySelector(".cart-toggle").addEventListener("click",()=>{updateCart();openDialog(cartDialog);});
document.querySelector(".nav-order").addEventListener("click",event=>{if(products.some(p=>cart[p.id])){event.preventDefault();updateCart();openDialog(cartDialog);}});

function prepareOrder(){
  const entries=products.filter(p=>cart[p.id]);
  if(!entries.length){notify("Añade un producto antes de preparar tu pedido.");return null;}
  syncFulfillment();
  const method=checkoutForm.querySelector('[name="fulfillment"]:checked')?.value;
  const branch=orderBranches.find(b=>b.id===branchSelect.value);
  branchSelect.setCustomValidity(branch?"":"Elige la sucursal que preparará tu pedido.");
  addressInput.setCustomValidity(method==="delivery"&&!addressInput.value.trim()?"Indica la dirección de entrega.":"");
  if(!checkoutForm.reportValidity()||!branch||!["delivery","pickup"].includes(method))return null;
  if(method==="delivery"&&!deliveryLocation.validate())return null;
  const notes=notesInput.value.trim();
  const reference=referenceInput.value.trim();
  const total=entries.reduce((n,p)=>n+p.price*cart[p.id],0);
  const summary=[`¡Hola, ${branch.name}! Quisiera hacer este pedido:`,"",`Sucursal: ${branch.name}`,`Modalidad: ${method==="delivery"?"Delivery a domicilio":"Para recoger en sucursal"}`,
    ...(method==="delivery"?[`Dirección de entrega: ${addressInput.value.trim()}`,`Ubicación en el mapa: ${deliveryLocation.getUrl()}`,...(reference?[`Referencia: ${reference}`]:[])]:[`Recojo en: ${branch.address}`]),
    "",...entries.map(p=>`${cart[p.id]} × ${p.name} (${p.serving}) — ${money(p.price*cart[p.id])}`),"",`Subtotal de productos: ${money(total)}`,...(notes?[`Notas: ${notes}`]:[]),"",
    method==="delivery"?"Por favor, confirmen cobertura y costo de delivery, disponibilidad, total final y forma de pago.":"Por favor, confirmen disponibilidad, hora de recojo, total final y forma de pago."
  ].join("\n");
  return {branch,summary};
}
checkoutForm.addEventListener("submit",event=>{
  event.preventDefault();
  const order=prepareOrder();
  if(!order)return;
  const url=`https://wa.me/${order.branch.phone}?text=${encodeURIComponent(order.summary)}`;
  const link=document.querySelector("#whatsapp-order-link");
  link.href=url;
  link.textContent=`Abrir el chat de ${order.branch.name} ↗`;
  document.querySelector("#whatsapp-status").textContent=`Pedido preparado para ${order.branch.name}. Revisa el mensaje y pulsa Enviar en WhatsApp.`;
  document.querySelector("#whatsapp-ready").hidden=false;
  window.open(url,"_blank","noopener,noreferrer");
});
document.querySelector("#copy-order").addEventListener("click",async()=>{
  const order=prepareOrder();
  if(!order)return;
  try {
    if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(order.summary);
    notify(`Pedido copiado para ${order.branch.name}.`);
  } catch {
    document.querySelector("#copy-fallback").hidden=false;
    const text=document.querySelector("#order-summary");
    text.value=order.summary;text.focus();text.select();
    notify("Tu resumen está listo. Selecciónalo y cópialo.");
  }
});

const mobileToggle=document.querySelector(".mobile-toggle");
const mobileNav=document.querySelector(".mobile-nav");
function closeMobileNav(){mobileToggle.setAttribute("aria-expanded","false");mobileToggle.setAttribute("aria-label","Abrir menú");mobileNav.hidden=true;}
mobileToggle.addEventListener("click",()=>{const open=mobileToggle.getAttribute("aria-expanded")!=="true";mobileToggle.setAttribute("aria-expanded",String(open));mobileToggle.setAttribute("aria-label",open?"Cerrar menú":"Abrir menú");mobileNav.hidden=!open;});
mobileNav.addEventListener("click",event=>{if(event.target.closest("a"))closeMobileNav();});
document.addEventListener("click",event=>{if(!event.target.closest(".header"))closeMobileNav();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&mobileToggle.getAttribute("aria-expanded")==="true"){closeMobileNav();mobileToggle.focus();}});
matchMedia("(min-width: 1001px)").addEventListener("change",event=>{if(event.matches)closeMobileNav();});
document.querySelector("#year").textContent=new Date().getFullYear();

renderMenu();
updateCart();

if("IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal");
  const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("is-visible");revealObserver.unobserve(entry.target);}},{threshold:.08});
  document.querySelectorAll(".reveal").forEach(element=>revealObserver.observe(element));
}

for(const button of document.querySelectorAll("[data-map-query]"))button.addEventListener("click",()=>{
  const query=encodeURIComponent(button.dataset.mapQuery);
  const frame=document.getElementById("location-map");
  frame.src=`https://maps.google.com/maps?q=${query}&output=embed`;
  frame.title=`Mapa de ${button.dataset.mapName}`;
  document.getElementById("map-location-name").textContent=button.dataset.mapName;
  document.getElementById("open-location-map").href=`https://www.google.com/maps/search/?api=1&query=${query}`;
  document.querySelectorAll("[data-map-query]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
  document.getElementById("sucursal-mapa").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
});
