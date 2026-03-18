// ============================================================
//  ZUNITRA — Shared Utilities
// ============================================================

import { db, auth } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Page Loader ──────────────────────────────────────────────
export function initLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 800);
  });
}

// ── Custom Cursor ─────────────────────────────────────────────
export function initCursor() {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let rx = 0, ry = 0, mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });
  document.addEventListener("mousedown", () => ring.classList.add("clicking"));
  document.addEventListener("mouseup", () => ring.classList.remove("clicking"));
  document.querySelectorAll("a, button, [data-hover]").forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("hovering"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hovering"));
  });

  function animate() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(animate);
  }
  animate();
}

// ── Sticky Nav ────────────────────────────────────────────────
export function initNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  // Mark active link
  const links = nav.querySelectorAll(".nav-links a");
  links.forEach(a => {
    if (window.location.pathname.endsWith(a.getAttribute("href"))) {
      a.classList.add("active");
    }
  });
  // Scroll effect
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ── Auth State → Nav ──────────────────────────────────────────
export function initAuthNav() {
  const accountBtn = document.getElementById("nav-account-btn");
  if (!accountBtn) return;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      accountBtn.title = user.displayName || user.email;
      accountBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;background:var(--green);border-radius:50%;border:1px solid var(--black)"></span>`;
      accountBtn.onclick = () => navigate("account.html");
    } else {
      accountBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      accountBtn.onclick = () => openAuthModal();
    }
  });
}

// ── Navigation helper ─────────────────────────────────────────
export function navigate(path) {
  window.location.href = path;
}

// ── Toast Notifications ───────────────────────────────────────
function getOrCreateContainer() {
  let c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(msg, type = "success", duration = 3000) {
  const container = getOrCreateContainer();
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `
    <span class="toast-icon ${type}">${icons[type]}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add("removing");
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── Scroll Reveal ─────────────────────────────────────────────
export function initScrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

// ── Cart (localStorage) ───────────────────────────────────────
export const Cart = {
  get() { return JSON.parse(localStorage.getItem("zunitra_cart") || "[]"); },
  save(items) {
    localStorage.setItem("zunitra_cart", JSON.stringify(items));
    Cart.updateBadge();
    window.dispatchEvent(new CustomEvent("cart-updated"));
  },
  add(product, qty = 1) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx >= 0) items[idx].qty += qty;
    else items.push({ ...product, qty });
    Cart.save(items);
    showToast(`${product.name} added to your selection`);
  },
  remove(id) {
    Cart.save(Cart.get().filter(i => i.id !== id));
  },
  updateQty(id, qty) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      if (qty <= 0) items.splice(idx, 1);
      else items[idx].qty = qty;
    }
    Cart.save(items);
  },
  clear() { Cart.save([]); },
  total() { return Cart.get().reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },
  updateBadge() {
    const badge = document.getElementById("cart-badge");
    const count = Cart.count();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }
};

// ── Products (Firestore with localStorage fallback) ───────────
import { PRODUCTS } from "./seed.js";

export async function fetchProducts(filters = {}) {
  try {
    let q = collection(db, "products");
    const constraints = [];
    if (filters.category && filters.category !== "all") {
      constraints.push(where("category", "==", filters.category));
    }
    if (constraints.length) q = query(q, ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No products in Firestore");
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    // Fallback to local data when Firebase not configured
    let data = [...PRODUCTS];
    if (filters.category && filters.category !== "all") {
      data = data.filter(p => p.category === filters.category);
    }
    return data;
  }
}

export async function fetchProduct(id) {
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    throw new Error("Not found");
  } catch {
    return PRODUCTS.find(p => p.id === id) || null;
  }
}

// ── Orders (Firestore) ────────────────────────────────────────
export async function createOrder(orderData) {
  const ref = await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: serverTimestamp(),
    status: "pending"
  });
  return ref.id;
}

export async function getUserOrders(uid) {
  try {
    const q = query(collection(db, "orders"), where("uid", "==", uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ── Watch SVG Generator ───────────────────────────────────────
export function watchSVG(w, size = 200) {
  const accent = w.accentColor || "#C9A84C";
  const bg = w.color || "#111";
  const id = w.id || "w";
  const ticks = [...Array(12)].map((_, i) => {
    const a = (i * 30 - 90) * (Math.PI / 180);
    const r1 = 56, r2 = i % 3 === 0 ? 46 : 52;
    const x1 = 100 + r1 * Math.cos(a), y1 = 120 + r1 * Math.sin(a);
    const x2 = 100 + r2 * Math.cos(a), y2 = 120 + r2 * Math.sin(a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${accent}" stroke-width="${i % 3 === 0 ? 2 : 1}" opacity="${i % 3 === 0 ? 0.85 : 0.45}"/>`;
  }).join("");
  return `<svg viewBox="0 0 200 240" width="${size}" height="${size * 1.2}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wbg${id}" cx="38%" cy="32%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="wshadow${id}">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${accent}" flood-opacity="0.2"/>
    </filter>
  </defs>
  <!-- Strap top -->
  <rect x="78" y="2" width="44" height="50" rx="7" fill="${bg}" stroke="${accent}" stroke-opacity="0.2" stroke-width="1"/>
  <line x1="90" y1="10" x2="90" y2="44" stroke="${accent}" stroke-opacity="0.15" stroke-width="1"/>
  <line x1="110" y1="10" x2="110" y2="44" stroke="${accent}" stroke-opacity="0.15" stroke-width="1"/>
  <!-- Case shadow -->
  <circle cx="100" cy="122" r="72" fill="rgba(0,0,0,0.4)"/>
  <!-- Case -->
  <circle cx="100" cy="120" r="70" fill="${bg}" stroke="${accent}" stroke-width="2.5" filter="url(#wshadow${id})"/>
  <circle cx="100" cy="120" r="65" fill="url(#wbg${id})" stroke="${accent}" stroke-opacity="0.35" stroke-width="1"/>
  <circle cx="100" cy="120" r="58" fill="none" stroke="${accent}" stroke-opacity="0.15" stroke-width="0.5"/>
  <!-- Crown -->
  <rect x="169" y="113" width="11" height="14" rx="3" fill="${accent}" fill-opacity="0.7" stroke="${accent}" stroke-width="0.5"/>
  <!-- Tick marks -->
  ${ticks}
  <!-- Logo -->
  <text x="100" y="102" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" fill="${accent}" letter-spacing="2.5" opacity="0.95">ZUNITRA</text>
  <!-- Hour hand -->
  <line x1="100" y1="120" x2="86" y2="88" stroke="white" stroke-width="3.5" stroke-linecap="round" opacity="0.95"/>
  <!-- Minute hand -->
  <line x1="100" y1="120" x2="124" y2="78" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Second hand -->
  <line x1="100" y1="128" x2="97" y2="74" stroke="#DD2233" stroke-width="1" stroke-linecap="round"/>
  <!-- Center -->
  <circle cx="100" cy="120" r="5" fill="${accent}"/>
  <circle cx="100" cy="120" r="2.5" fill="${bg}"/>
  <!-- Strap bottom -->
  <rect x="78" y="188" width="44" height="50" rx="7" fill="${bg}" stroke="${accent}" stroke-opacity="0.2" stroke-width="1"/>
  <line x1="90" y1="196" x2="90" y2="230" stroke="${accent}" stroke-opacity="0.15" stroke-width="1"/>
  <line x1="110" y1="196" x2="110" y2="230" stroke="${accent}" stroke-opacity="0.15" stroke-width="1"/>
  <!-- Buckle -->
  <rect x="88" y="226" width="24" height="10" rx="2" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
  <line x1="100" y1="226" x2="100" y2="236" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
</svg>`;
}

// ── Auth Modal ────────────────────────────────────────────────
let authModalEl = null;
export function openAuthModal(mode = "login") {
  if (!authModalEl) {
    authModalEl = document.getElementById("auth-modal");
  }
  if (authModalEl) {
    authModalEl.classList.add("open");
    if (mode === "signup") {
      const tabs = authModalEl.querySelectorAll(".auth-tab");
      tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === "signup"));
      authModalEl.querySelectorAll(".auth-panel").forEach(p => {
        p.style.display = p.id === "panel-signup" ? "block" : "none";
      });
    }
  }
}
export function closeAuthModal() {
  if (authModalEl) authModalEl.classList.remove("open");
}

// ── Format currency ───────────────────────────────────────────
export function fmtPrice(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

// ── Stars HTML ────────────────────────────────────────────────
export function starsHTML(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ── Init all shared things ────────────────────────────────────
export function initShared() {
  initLoader();
  initCursor();
  initNav();
  initAuthNav();
  initScrollReveal();
  Cart.updateBadge();
  // Re-run hover listeners after DOM ready for cursor
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a, button, [data-hover]").forEach(el => {
      el.addEventListener("mouseenter", () => document.querySelector(".cursor-ring")?.classList.add("hovering"));
      el.addEventListener("mouseleave", () => document.querySelector(".cursor-ring")?.classList.remove("hovering"));
    });
  });
}
