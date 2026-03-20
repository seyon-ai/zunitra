// ============================================================
//  ZUNITRA — Shared Utilities  (v2 — clean rebuild)
// ============================================================

import { db, auth } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { PRODUCTS } from "./seed.js";

// ── USD → INR rate (update as needed) ────────────────────────
const USD_TO_INR = 83.5;

// ── Currency formatter ────────────────────────────────────────
export function fmtPrice(usd) {
  const n = Number(usd);
  const inr = Math.round(n * USD_TO_INR);
  return `$${n.toLocaleString("en-US")}&nbsp;<small style="color:#888;font-size:0.65em;font-family:'Montserrat',sans-serif">/ ₹${inr.toLocaleString("en-IN")}</small>`;
}
export function fmtPriceRaw(usd) {
  return "$" + Number(usd).toLocaleString("en-US");
}

// ── Stars ─────────────────────────────────────────────────────
export function starsHTML(n) {
  n = Math.min(5, Math.max(0, n || 5));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ── Watch SVG ─────────────────────────────────────────────────
export function watchSVG(w, size) {
  size = size || 200;
  const accent = (w && w.accentColor) || "#C9A84C";
  const bg     = (w && w.color)       || "#111111";
  const wid    = (w && w.id)          || "w";
  const ticks  = Array.from({length:12}, function(_,i){
    const a  = (i*30 - 90) * Math.PI / 180;
    const r1 = 56, r2 = (i%3===0) ? 46 : 52;
    const x1 = (100 + r1*Math.cos(a)).toFixed(1);
    const y1 = (120 + r1*Math.sin(a)).toFixed(1);
    const x2 = (100 + r2*Math.cos(a)).toFixed(1);
    const y2 = (120 + r2*Math.sin(a)).toFixed(1);
    const sw = (i%3===0) ? 2 : 1;
    const op = (i%3===0) ? 0.85 : 0.45;
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+accent+'" stroke-width="'+sw+'" opacity="'+op+'"/>';
  }).join("");
  return '<svg viewBox="0 0 200 240" width="'+size+'" height="'+(size*1.2)+'" xmlns="http://www.w3.org/2000/svg">'
    +'<defs>'
    +'<radialGradient id="wbg'+wid+'" cx="38%" cy="32%">'
    +'<stop offset="0%" stop-color="'+accent+'" stop-opacity="0.18"/>'
    +'<stop offset="100%" stop-color="'+bg+'" stop-opacity="0"/>'
    +'</radialGradient>'
    +'<filter id="ws'+wid+'"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="'+accent+'" flood-opacity="0.2"/></filter>'
    +'</defs>'
    +'<rect x="78" y="2" width="44" height="50" rx="7" fill="'+bg+'" stroke="'+accent+'" stroke-opacity="0.2" stroke-width="1"/>'
    +'<circle cx="100" cy="122" r="72" fill="rgba(0,0,0,0.4)"/>'
    +'<circle cx="100" cy="120" r="70" fill="'+bg+'" stroke="'+accent+'" stroke-width="2.5" filter="url(#ws'+wid+')"/>'
    +'<circle cx="100" cy="120" r="65" fill="url(#wbg'+wid+')" stroke="'+accent+'" stroke-opacity="0.35" stroke-width="1"/>'
    +'<rect x="169" y="113" width="11" height="14" rx="3" fill="'+accent+'" fill-opacity="0.7"/>'
    +ticks
    +'<text x="100" y="102" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" fill="'+accent+'" letter-spacing="2.5">ZUNITRA</text>'
    +'<line x1="100" y1="120" x2="86" y2="88" stroke="white" stroke-width="3.5" stroke-linecap="round"/>'
    +'<line x1="100" y1="120" x2="124" y2="78" stroke="'+accent+'" stroke-width="2.5" stroke-linecap="round"/>'
    +'<line x1="100" y1="128" x2="97" y2="74" stroke="#DD2233" stroke-width="1" stroke-linecap="round"/>'
    +'<circle cx="100" cy="120" r="5" fill="'+accent+'"/>'
    +'<circle cx="100" cy="120" r="2.5" fill="'+bg+'"/>'
    +'<rect x="78" y="188" width="44" height="50" rx="7" fill="'+bg+'" stroke="'+accent+'" stroke-opacity="0.2" stroke-width="1"/>'
    +'<rect x="88" y="226" width="24" height="10" rx="2" fill="none" stroke="'+accent+'" stroke-opacity="0.5" stroke-width="1.5"/>'
    +'</svg>';
}

// ── Product image display (real image OR SVG fallback) ────────
export function watchDisplay(w, size) {
  size = size || 200;
  var h = Math.round(size * 1.2);

  // Get image URL — validate it's a direct image link
  var imgUrl = "";
  var rawUrls = [];
  if (w.images && Array.isArray(w.images)) rawUrls = w.images.slice();
  if (w.imageUrl) rawUrls.unshift(w.imageUrl);

  for (var i = 0; i < rawUrls.length; i++) {
    var u = (rawUrls[i] || "").trim();
    // Skip ibb.co page links (not direct images)
    if (u && !/^https?:\/\/ibb\.co\/[^/]+$/.test(u)) {
      imgUrl = u;
      break;
    }
  }

  // No valid URL — return SVG watch illustration
  if (!imgUrl) return watchSVG(w, size);

  // Return image wrapped in a span
  // Use a simple approach: img with onerror that swaps to SVG via a hidden span
  var pid = 'z' + (w.id || Date.now().toString(36)).toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  return '<span style="display:inline-block;width:' + size + 'px;height:' + h + 'px;overflow:hidden;position:relative">'
    + '<img id="img-' + pid + '" src="' + imgUrl + '" alt="" '
    + 'style="width:' + size + 'px;height:' + h + 'px;object-fit:cover;display:block" '
    + 'onerror="var p=document.getElementById('svg-' + pid + '');var i=document.getElementById('img-' + pid + '');if(p&&i){i.style.display='none';p.style.display='inline-block'}" '
    + '/>'
    + '<span id="svg-' + pid + '" style="display:none;position:absolute;top:0;left:0">'
    + watchSVG(w, size)
    + '</span>'
    + '</span>';
}

// ── Page Loader ───────────────────────────────────────────────
export function initLoader() {
  var loader = document.getElementById("page-loader");
  if (!loader) return;
  window.addEventListener("load", function(){
    setTimeout(function(){ loader.classList.add("hidden"); }, 600);
  });
}

// ── Cursor ────────────────────────────────────────────────────
export function initCursor() {
  var dot  = document.createElement("div"); dot.className  = "cursor-dot";
  var ring = document.createElement("div"); ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  var rx=0, ry=0, mx=0, my=0;
  document.addEventListener("mousemove", function(e){ mx=e.clientX; my=e.clientY; dot.style.left=mx+"px"; dot.style.top=my+"px"; });
  document.addEventListener("mousedown", function(){ ring.classList.add("clicking"); });
  document.addEventListener("mouseup",   function(){ ring.classList.remove("clicking"); });
  function tick(){ rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12; ring.style.left=rx+"px"; ring.style.top=ry+"px"; requestAnimationFrame(tick); }
  tick();
  function addHover(els){ els.forEach(function(el){ el.addEventListener("mouseenter",function(){ ring.classList.add("hovering"); }); el.addEventListener("mouseleave",function(){ ring.classList.remove("hovering"); }); }); }
  addHover(document.querySelectorAll("a,button,[data-hover]"));
  // watch for new elements
  new MutationObserver(function(){ addHover(document.querySelectorAll("a,button,[data-hover]")); }).observe(document.body,{childList:true,subtree:true});
}

// ── Nav ───────────────────────────────────────────────────────
export function initNav() {
  var nav = document.getElementById("nav");
  if (!nav) return;
  nav.querySelectorAll(".nav-links a").forEach(function(a){
    if (window.location.href.indexOf(a.getAttribute("href")) !== -1) a.classList.add("active");
  });
  function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
}

// ── Auth Nav ──────────────────────────────────────────────────
export function initAuthNav() {
  var btn = document.getElementById("nav-account-btn");
  if (!btn) return;
  onAuthStateChanged(auth, function(user){
    if (user) {
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        +'<span style="position:absolute;bottom:0;right:0;width:8px;height:8px;background:#27AE60;border-radius:50%;border:1px solid #080808"></span>';
      btn.onclick = function(){ window.location.href="account.html"; };
    } else {
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      btn.onclick = function(){ window.openAuthModal && window.openAuthModal(); };
    }
  });
}

// ── Scroll Reveal ─────────────────────────────────────────────
export function initScrollReveal() {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target); } });
  },{threshold:0.1});
  els.forEach(function(el){ io.observe(el); });
}

// ── Toast ─────────────────────────────────────────────────────
export function showToast(msg, type) {
  type = type || "success";
  var icons = {success:"✓", error:"✕", info:"ℹ"};
  var c = document.getElementById("toast-container");
  if (!c) { c = document.createElement("div"); c.id="toast-container"; document.body.appendChild(c); }
  var t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<span class="toast-icon '+type+'">'+(icons[type]||"ℹ")+'</span><span class="toast-msg">'+msg+'</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>';
  c.appendChild(t);
  setTimeout(function(){ t.style.opacity="0"; t.style.transform="translateX(20px)"; t.style.transition="all 0.3s"; setTimeout(function(){ t.remove(); },300); }, 3000);
}

// ── Cart ──────────────────────────────────────────────────────
export var Cart = {
  get: function(){ return JSON.parse(localStorage.getItem("zunitra_cart")||"[]"); },
  save: function(items){
    localStorage.setItem("zunitra_cart", JSON.stringify(items));
    Cart.updateBadge();
    window.dispatchEvent(new CustomEvent("cart-updated"));
  },
  add: function(product, qty){
    qty = qty||1;
    var items = Cart.get();
    var idx = items.findIndex(function(i){ return i.id===product.id; });
    if (idx>=0) items[idx].qty += qty; else items.push(Object.assign({},product,{qty:qty}));
    Cart.save(items);
    showToast(product.name+" added to cart");
  },
  remove: function(id){ Cart.save(Cart.get().filter(function(i){ return i.id!==id; })); },
  updateQty: function(id, qty){
    var items = Cart.get();
    var idx = items.findIndex(function(i){ return i.id===id; });
    if (idx>=0){ if(qty<=0) items.splice(idx,1); else items[idx].qty=qty; }
    Cart.save(items);
  },
  clear: function(){ Cart.save([]); },
  total: function(){ return Cart.get().reduce(function(s,i){ return s+i.price*i.qty; },0); },
  count: function(){ return Cart.get().reduce(function(s,i){ return s+i.qty; },0); },
  updateBadge: function(){
    var badge = document.getElementById("cart-badge");
    var count = Cart.count();
    if (badge){ badge.textContent=count; badge.style.display=count>0?"flex":"none"; }
  }
};

// ── Firestore: Products ───────────────────────────────────────
export async function fetchProducts(filters) {
  filters = filters || {};
  try {
    var snap = await getDocs(collection(db, "products"));
    if (snap.empty) throw new Error("empty");
    var data = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    if (filters.category && filters.category !== "all") {
      data = data.filter(function(p){ return p.category === filters.category; });
    }
    return data;
  } catch(e) {
    var data = PRODUCTS.slice();
    if (filters.category && filters.category !== "all") {
      data = data.filter(function(p){ return p.category === filters.category; });
    }
    return data;
  }
}

export async function fetchProduct(id) {
  try {
    var snap = await getDoc(doc(db, "products", id));
    if (snap.exists()) return Object.assign({id:snap.id}, snap.data());
    throw new Error("not found");
  } catch(e) {
    return PRODUCTS.find(function(p){ return p.id===id; }) || null;
  }
}

// ── Firestore: Orders ─────────────────────────────────────────
export async function createOrder(orderData) {
  var ref = await addDoc(collection(db, "orders"), Object.assign({}, orderData, {
    createdAt: serverTimestamp(),
    status: "pending"
  }));
  return ref.id;
}

export async function getUserOrders(uid) {
  try {
    // simple query — no composite index needed
    var q = query(collection(db, "orders"), where("uid","==",uid));
    var snap = await getDocs(q);
    var orders = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    // sort client-side newest first
    orders.sort(function(a,b){
      var ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
      var tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
      return tb - ta;
    });
    return orders;
  } catch(e){ return []; }
}

// ── initShared ────────────────────────────────────────────────
export function initShared() {
  initLoader();
  initCursor();
  initNav();
  initAuthNav();
  initScrollReveal();
  Cart.updateBadge();
}
