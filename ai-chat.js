/**
 * ZUNITRA — Zara AI Shopping Assistant v2.0
 * Features: chat, product search, order placement, image display, product links
 * Add before </body>: <script src="ai-chat.js"></script>
 */
(function () {
  "use strict";

  // ── KEYS ────────────────────────────────────────────────────
  const GROQ_URL    = "/api/groq"; // Serverless proxy — key hidden server-side
  const IMGBB_KEY   = "9ffd3eb7bc11952fe349f2902f4df74b";
  const SITE_URL    = "https://zunitra-luxury-tawny.vercel.app";
  const USD_TO_INR  = 83.5;
  const CART_KEY    = "zunitra_cart";
  const MAX_HIST    = 14;

  // ── STATE ────────────────────────────────────────────────────
  let isOpen = false, isTyping = false;
  let products = [], productsLoaded = false;
  let conversation = [];
  let pendingOrder = null; // stores order being built via chat
  let currentUser   = null;

  // ── INJECT CSS ───────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
  #zn-btn{position:fixed;bottom:28px;right:28px;z-index:9000;width:62px;height:62px;background:linear-gradient(135deg,#9A7A2E,#C9A84C);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 28px rgba(201,168,76,.45);transition:all .3s;font-size:26px;}
  #zn-btn:hover{transform:scale(1.09);box-shadow:0 6px 36px rgba(201,168,76,.65);}
  #zn-btn .zn-notif{position:absolute;top:-2px;right:-2px;background:#C0392B;color:#fff;font-size:9px;font-weight:700;width:18px;height:18px;border-radius:50%;display:none;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;}

  #zn-win{position:fixed;bottom:104px;right:28px;z-index:8999;width:390px;height:620px;background:#0F0F0F;border:1px solid rgba(201,168,76,.25);box-shadow:0 20px 80px rgba(0,0,0,.85);display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(24px) scale(.95);transition:all .35s cubic-bezier(.34,1.56,.64,1);transform-origin:bottom right;}
  #zn-win.open{opacity:1;visibility:visible;transform:translateY(0) scale(1);}

  .zn-hd{background:linear-gradient(135deg,#141414,#1C1C1C);border-bottom:1px solid rgba(201,168,76,.15);padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;}
  .zn-av{width:40px;height:40px;background:linear-gradient(135deg,#9A7A2E,#C9A84C);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
  .zn-hd-name{font-family:'Cormorant Garamond',serif;font-size:17px;color:#F5F0E8;line-height:1;margin-bottom:3px;}
  .zn-hd-st{font-size:9px;letter-spacing:1px;color:#27AE60;display:flex;align-items:center;gap:5px;}
  .zn-dot{width:6px;height:6px;border-radius:50%;background:#27AE60;animation:znP 2s infinite;}
  @keyframes znP{0%,100%{opacity:1}50%{opacity:.3}}
  .zn-x{background:none;border:1px solid rgba(255,255,255,.1);color:#666;width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .2s;margin-left:auto;flex-shrink:0;}
  .zn-x:hover{border-color:#C9A84C;color:#C9A84C;}

  .zn-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#222 transparent;}
  .zn-msgs::-webkit-scrollbar{width:3px;}
  .zn-msgs::-webkit-scrollbar-thumb{background:#222;}

  .zn-m{display:flex;gap:8px;align-items:flex-end;animation:znFU .3s ease;}
  @keyframes znFU{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .zn-m.u{flex-direction:row-reverse;}
  .zn-mav{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;}
  .zn-m.ai .zn-mav{background:linear-gradient(135deg,#9A7A2E,#C9A84C);}
  .zn-m.u .zn-mav{background:#1A1A1A;border:1px solid rgba(255,255,255,.1);}
  .zn-bbl{max-width:82%;padding:10px 13px;font-family:'Montserrat',sans-serif;font-size:12px;line-height:1.75;color:#F5F0E8;}
  .zn-m.ai .zn-bbl{background:#141414;border:1px solid rgba(255,255,255,.07);border-bottom-left-radius:0;}
  .zn-m.u .zn-bbl{background:linear-gradient(135deg,#9A7A2E,#C9A84C);color:#080808;border-bottom-right-radius:0;}
  .zn-ts{font-size:9px;color:#444;margin-top:3px;font-family:'Montserrat',sans-serif;}
  .zn-m.u .zn-ts{text-align:right;}

  /* Product card in chat */
  .zn-pc{display:flex;gap:10px;align-items:center;background:#1A1A1A;border:1px solid rgba(201,168,76,.2);padding:10px;margin-top:8px;cursor:pointer;transition:border-color .2s;text-decoration:none;}
  .zn-pc:hover{border-color:rgba(201,168,76,.5);}
  .zn-pi{width:54px;height:54px;background:radial-gradient(circle at 50% 40%,#181818,#0a0a0a);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;overflow:hidden;}
  .zn-pi img{width:100%;height:100%;object-fit:cover;}
  .zn-pinfo{flex:1;min-width:0;}
  .zn-pbr{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-family:'Montserrat',sans-serif;}
  .zn-pnm{font-family:'Cormorant Garamond',serif;font-size:15px;color:#F5F0E8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .zn-ppr{font-family:'Cormorant Garamond',serif;font-size:15px;color:#C9A84C;}
  .zn-ppr small{font-family:'Montserrat',sans-serif;font-size:9px;color:#555;display:block;}
  .zn-plink{font-size:9px;color:#5DADE2;letter-spacing:1px;text-transform:uppercase;font-family:'Montserrat',sans-serif;white-space:nowrap;}

  /* Order confirmation box in chat */
  .zn-order-box{background:#141414;border:1px solid rgba(201,168,76,.3);padding:14px;margin-top:8px;font-family:'Montserrat',sans-serif;font-size:11px;}
  .zn-order-title{font-family:'Cormorant Garamond',serif;font-size:18px;color:#C9A84C;margin-bottom:10px;}
  .zn-order-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);color:#999;}
  .zn-order-row span:last-child{color:#F5F0E8;text-align:right;}
  .zn-order-btns{display:flex;gap:8px;margin-top:12px;}
  .zn-obtn{flex:1;padding:9px;border:none;font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
  .zn-obtn.confirm{background:#C9A84C;color:#080808;}
  .zn-obtn.confirm:hover{background:#E8C96A;}
  .zn-obtn.cancel{background:none;border:1px solid rgba(255,255,255,.1);color:#666;}
  .zn-obtn.cancel:hover{color:#F5F0E8;}

  /* Typing */
  .zn-typ{display:flex;gap:4px;align-items:center;padding:10px 13px;background:#141414;border:1px solid rgba(255,255,255,.07);width:fit-content;}
  .zn-typ span{width:6px;height:6px;background:#C9A84C;border-radius:50%;animation:znB 1.2s infinite;}
  .zn-typ span:nth-child(2){animation-delay:.2s;}
  .zn-typ span:nth-child(3){animation-delay:.4s;}
  @keyframes znB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}

  /* Quick replies */
  .zn-qr-wrap{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px;}
  .zn-qr{background:none;border:1px solid rgba(201,168,76,.3);color:#C9A84C;font-size:10px;letter-spacing:1px;padding:6px 11px;cursor:pointer;font-family:'Montserrat',sans-serif;transition:all .2s;text-transform:uppercase;}
  .zn-qr:hover{background:rgba(201,168,76,.1);}

  /* Input */
  .zn-inp-wrap{border-top:1px solid rgba(255,255,255,.06);padding:11px 13px;display:flex;gap:9px;align-items:flex-end;flex-shrink:0;background:#0F0F0F;}
  .zn-inp{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#F5F0E8;padding:10px 13px;font-size:12px;font-family:'Montserrat',sans-serif;outline:none;resize:none;min-height:40px;max-height:90px;line-height:1.5;transition:border-color .3s;}
  .zn-inp:focus{border-color:rgba(201,168,76,.4);}
  .zn-inp::placeholder{color:#444;}
  .zn-send{width:40px;height:40px;background:linear-gradient(135deg,#9A7A2E,#C9A84C);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:16px;}
  .zn-send:hover{background:linear-gradient(135deg,#C9A84C,#E8C96A);}
  .zn-send:disabled{opacity:.4;pointer-events:none;}
  .zn-pw{text-align:center;font-size:9px;color:#2A2A2A;font-family:'Montserrat',sans-serif;letter-spacing:1px;padding:3px 0 9px;}

  @media(max-width:480px){
    #zn-win{width:calc(100vw - 16px);right:8px;bottom:88px;height:72vh;}
    #zn-btn{bottom:14px;right:14px;}
  }
  `;
  document.head.appendChild(css);

  // ── BUILD HTML ───────────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.innerHTML = `
  <button id="zn-btn" onclick="znToggle()" title="Chat with Zara">
    <span id="zn-icon">⌚</span>
    <span class="zn-notif" id="zn-notif">1</span>
  </button>
  <div id="zn-win">
    <div class="zn-hd">
      <div class="zn-av">✦</div>
      <div>
        <div class="zn-hd-name">Zara — Zunitra Advisor</div>
        <div class="zn-hd-st"><div class="zn-dot"></div>Online · AI Powered</div>
      </div>
      <button class="zn-x" onclick="znToggle()">✕</button>
    </div>
    <div class="zn-msgs" id="zn-msgs"></div>
    <div class="zn-qr-wrap" id="zn-qrs">
      <button class="zn-qr" onclick="znQ('Show me your best luxury watches')">Luxury</button>
      <button class="zn-qr" onclick="znQ('I have a budget of $1000')">Under $1K</button>
      <button class="zn-qr" onclick="znQ('I need a gift for him')">Gift Ideas</button>
      <button class="zn-qr" onclick="znQ('Show me sport watches')">Sport</button>
      <button class="zn-qr" onclick="znQ('I want to buy a watch')">Buy Now</button>
    </div>
    <div class="zn-inp-wrap">
      <textarea class="zn-inp" id="zn-inp" placeholder="Ask Zara anything..." rows="1"
        onkeydown="znKey(event)" oninput="znResize(this)"></textarea>
      <button class="zn-send" id="zn-send" onclick="znSend()">➤</button>
    </div>
    <div class="zn-pw">✦ Zara by ZUNITRA · Powered by Groq AI</div>
  </div>`;
  document.body.appendChild(wrap);

  // ── FIREBASE INIT ────────────────────────────────────────────
  async function getDB() {
    try {
      const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const config = {
        apiKey:"AIzaSyDlqviz3CSecuxvRe_IYOKFNFFFLx7_KYs",
        authDomain:"zunitra.firebaseapp.com",
        projectId:"zunitra",
        storageBucket:"zunitra.firebasestorage.app",
        messagingSenderId:"28187912461",
        appId:"1:28187912461:web:3ff878061a9d866a5ce844"
      };
      const app = getApps().length ? getApp() : initializeApp(config);
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      return getFirestore(app);
    } catch(e) { return null; }
  }

  async function getAuth() {
    try {
      const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const config = {
        apiKey:"AIzaSyDlqviz3CSecuxvRe_IYOKFNFFFLx7_KYs",
        authDomain:"zunitra.firebaseapp.com",
        projectId:"zunitra"
      };
      const app = getApps().length ? getApp() : initializeApp(config);
      const { getAuth: _ga, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      const auth = _ga(app);
      return new Promise(resolve => {
        const unsub = onAuthStateChanged(auth, user => { currentUser = user; unsub(); resolve(user); });
      });
    } catch(e) { return null; }
  }

  // ── LOAD PRODUCTS ────────────────────────────────────────────
  async function loadProducts() {
    if (productsLoaded) return;
    try {
      const db = await getDB();
      if (!db) return;
      const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const snap = await getDocs(collection(db, "products"));
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      productsLoaded = true;
    } catch(e) { console.warn("Zara products:", e); }
  }

  // ── PRODUCT SEARCH ────────────────────────────────────────────
  function findProducts(query, max) {
    max = max || 3;
    if (!products.length) return [];
    const q = query.toLowerCase();
    return products.map(p => {
      let s = 0;
      if ((p.name||"").toLowerCase().includes(q))     s += 10;
      if ((p.brand||"").toLowerCase().includes(q))    s += 8;
      if ((p.desc||"").toLowerCase().includes(q))     s += 4;
      if ((p.category||"").toLowerCase().includes(q)) s += 6;
      const bm = q.match(/\$?(\d[\d,]*)/);
      if (bm) {
        const b = parseInt(bm[1].replace(/,/g,""));
        if ((p.price||0) <= b*1.15) s += 6;
        if ((p.price||0) <= b) s += 4;
      }
      if ((q.includes("sport")||q.includes("dive"))   && p.category==="sport")         s += 9;
      if ((q.includes("dress")||q.includes("formal")) && p.category==="dress")         s += 9;
      if ((q.includes("limit")||q.includes("rare"))   && p.category==="limited")       s += 9;
      if ((q.includes("auto")||q.includes("mechani")) && p.category==="complications") s += 9;
      if (q.includes("luxury") && (p.price||0)>1000) s += 5;
      if (q.includes("gift")) s += 3;
      if (q.includes("buy") || q.includes("order") || q.includes("want")) s += 4;
      return { ...p, _score: s };
    }).filter(p => p._score > 0)
      .sort((a,b) => b._score - a._score)
      .slice(0, max);
  }

  function productContext() {
    if (!products.length) return "No products loaded yet.";
    return products.slice(0,25).map(p =>
      `ID:${p.id} | ${p.brand} ${p.name} | $${p.price} | ${p.category} | ${p.desc||""} | Stock:${p.stock||"?"}`
    ).join("\n");
  }

  // ── POLLINATIONS IMAGE ────────────────────────────────────────
  function pollinationsImg(prompt, w, h) {
    w = w || 512; h = h || 512;
    const enc = encodeURIComponent(prompt + ", professional product photography, white background, ultra detailed");
    return `https://image.pollinations.ai/prompt/${enc}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random()*9999)}`;
  }

  // ── GROQ CALL ────────────────────────────────────────────────
  async function groq(messages, maxTokens) {
    const res = await fetch(GROQ_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ messages, temperature:0.72, max_tokens:maxTokens||500 })
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message||"AI error"); }
    const d = await res.json();
    return d.choices?.[0]?.message?.content || "";
  }

  // ── RENDER HELPERS ───────────────────────────────────────────
  function renderMsg(role, html, extras) {
    const box  = document.getElementById("zn-msgs");
    const el   = document.createElement("div");
    el.className = "zn-m " + (role==="user"?"u":"ai");
    const t = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
    const av = role==="user"?"👤":"✦";
    const text = html.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
    el.innerHTML = `<div class="zn-mav">${av}</div><div><div class="zn-bbl">${text}</div>${extras||""}<div class="zn-ts">${t}</div></div>`;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  }

  function productCards(prods) {
    return prods.map(p => {
      const inr = Math.round((p.price||0)*USD_TO_INR).toLocaleString("en-IN");
      const img = p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}">`
        : `<img src="${pollinationsImg(p.brand+" "+p.name+" luxury watch",54,54)}" alt="${p.name}" onerror="this.parentNode.innerHTML='⌚'">`;
      return `<a class="zn-pc" href="${SITE_URL}/product.html?id=${p.id}" target="_blank">
        <div class="zn-pi">${img}</div>
        <div class="zn-pinfo">
          <div class="zn-pbr">${p.brand||"Zunitra"}</div>
          <div class="zn-pnm">${p.name}</div>
          <div class="zn-ppr">$${(p.price||0).toLocaleString()}<small>₹${inr}</small></div>
        </div>
        <span class="zn-plink">View →</span>
      </a>`;
    }).join("");
  }

  function showTyping() {
    const box = document.getElementById("zn-msgs");
    const el = document.createElement("div");
    el.className="zn-m ai"; el.id="zn-typ";
    el.innerHTML=`<div class="zn-mav">✦</div><div class="zn-typ"><span></span><span></span><span></span></div>`;
    box.appendChild(el); box.scrollTop=box.scrollHeight;
  }
  function hideTyping() { const e=document.getElementById("zn-typ"); if(e) e.remove(); }

  // ── PLACE ORDER FROM CHAT ────────────────────────────────────
  function buildOrderConfirmBox(order) {
    const items = order.items.map(i=>`${i.name} ×${i.qty}`).join(", ");
    const total = "$"+(order.total||0).toLocaleString()+" / ₹"+Math.round((order.total||0)*USD_TO_INR).toLocaleString("en-IN");
    return `<div class="zn-order-box">
      <div class="zn-order-title">✦ Order Summary</div>
      <div class="zn-order-row"><span>Items</span><span>${items}</span></div>
      <div class="zn-order-row"><span>Name</span><span>${order.shipping.name}</span></div>
      <div class="zn-order-row"><span>Phone</span><span>${order.shipping.phone}</span></div>
      <div class="zn-order-row"><span>Address</span><span>${order.shipping.address}, ${order.shipping.city}</span></div>
      <div class="zn-order-row"><span>Country</span><span>${order.shipping.country}</span></div>
      <div class="zn-order-row"><span>Payment</span><span>${order.paymentMethod==="cod"?"Cash on Delivery":"Card"}</span></div>
      <div class="zn-order-row"><span>Subtotal</span><span>${total}</span></div>
      <div class="zn-order-row"><span>Shipping</span><span style="color:#C9A84C">Calculated within 24hrs</span></div>
      <div class="zn-order-btns">
        <button class="zn-obtn confirm" onclick="znConfirmOrder()">✓ Confirm Order</button>
        <button class="zn-obtn cancel" onclick="znCancelOrder()">✕ Cancel</button>
      </div>
    </div>`;
  }

  window.znConfirmOrder = async () => {
    if (!pendingOrder) return;
    const confirmBtns = document.querySelectorAll(".zn-obtn");
    confirmBtns.forEach(b => b.disabled = true);

    try {
      const db = await getDB();
      const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const ref = await addDoc(collection(db,"orders"), {
        ...pendingOrder,
        uid:       currentUser ? currentUser.uid : "guest_chat",
        email:     currentUser ? currentUser.email : pendingOrder.shipping.email||"",
        status:    "pending",
        source:    "zara_chat",
        shippingCost:0, shippingStatus:"pending_calculation",
        createdAt: serverTimestamp(),
      });
      const oid = ref.id.substring(0,8).toUpperCase();

      // Remove order box
      document.querySelectorAll(".zn-order-box").forEach(e=>e.remove());

      renderMsg("ai",
        `✦ **Order Confirmed!**\n\nYour order **#${oid}** has been placed successfully.\n\n` +
        `Track it anytime at your **Account → Orders** page.\n` +
        `Our team will add the shipping fee within 24 hours.\n\nIs there anything else I can help you with?`,
        `<div style="margin-top:8px"><a href="${SITE_URL}/account.html" target="_blank" style="font-size:10px;color:#C9A84C;letter-spacing:1px;text-transform:uppercase;font-family:'Montserrat',sans-serif;">→ Track My Order</a></div>`
      );
      conversation.push({role:"assistant",content:`Order #${oid} confirmed for ${pendingOrder.shipping.name}`});
      pendingOrder = null;

      // Update cart
      localStorage.removeItem(CART_KEY);

    } catch(e) {
      renderMsg("ai","I'm sorry, there was an issue placing your order. Please try again or visit the cart page directly.");
      confirmBtns.forEach(b => b.disabled = false);
    }
  };

  window.znCancelOrder = () => {
    document.querySelectorAll(".zn-order-box").forEach(e=>e.remove());
    pendingOrder = null;
    renderMsg("ai","No problem! Your order has been cancelled. Feel free to browse our collection or ask me anything else. ✦");
  };

  // ── MAIN CHAT LOGIC ──────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;
    isTyping = true;
    document.getElementById("zn-qrs").style.display = "none";
    renderMsg("user", text);
    conversation.push({role:"user",content:text});
    document.getElementById("zn-send").disabled = true;
    document.getElementById("zn-inp").value = "";
    document.getElementById("zn-inp").style.height = "40px";
    showTyping();

    if (!productsLoaded) await loadProducts();
    if (!currentUser) await getAuth();

    const suggested = findProducts(text, 3);
    const isOrderIntent = /\b(buy|order|place|purchase|want to buy|i'll take|i want)\b/i.test(text);
    const isAddressGiving = pendingOrder && /\d/.test(text) && text.length > 10;

    const systemPrompt = `You are Zara, a sophisticated luxury watch advisor for ZUNITRA — India's premier luxury watch store (${SITE_URL}).

PERSONALITY: Warm, elegant, concise. Like a high-end boutique advisor. Use watch terminology naturally.
RESPONSE LENGTH: Max 80 words. Be helpful, not verbose.

STORE PRODUCTS AVAILABLE:
${productContext()}

CAPABILITIES YOU HAVE:
1. Recommend products by name and price
2. Help customers place orders directly from chat (collect: name, phone, city, address, payment method)
3. Answer watch questions (movements, brands, care, etc.)
4. Show product links

ORDERING FLOW:
- If customer wants to buy, ask for: full name, phone, delivery address, city, country, payment (COD or card)
- Once you have all details, say "ORDER_READY" at the end of your message
- If collecting details, ask for one thing at a time naturally

IMPORTANT:
- Always include product page links as: ${SITE_URL}/product.html?id=PRODUCT_ID
- Never make up products not in the list
- Keep prices accurate
- If asked about shipping, say it's calculated within 24hrs after order`;

    try {
      const msgs = [
        {role:"system",content:systemPrompt},
        ...conversation.slice(-MAX_HIST)
      ];

      const reply = await groq(msgs, 400);
      hideTyping();

      const isOrderReady = reply.includes("ORDER_READY");
      const cleanReply   = reply.replace("ORDER_READY","").trim();

      conversation.push({role:"assistant",content:cleanReply});

      // Build product cards if relevant
      const cards = suggested.length > 0 ? productCards(suggested) : "";

      if (isOrderReady && !pendingOrder) {
        // Extract order details from conversation
        const extractPrompt = `Based on this conversation, extract the order details as JSON only (no extra text):
${conversation.slice(-8).map(m=>m.role+": "+m.content).join("\n")}

Return JSON: {"name":"","phone":"","address":"","city":"","country":"India","payment":"cod","items":[]}
Items should be products from this list that customer wants to buy: ${products.slice(0,20).map(p=>p.id+":"+p.name+"($"+p.price+")").join(", ")}
Payment is "cod" for cash on delivery, "card" otherwise.`;

        try {
          const extractedRaw = await groq([{role:"user",content:extractPrompt}], 300);
          const jsonStart = extractedRaw.indexOf("{");
          const jsonEnd   = extractedRaw.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const extracted = JSON.parse(extractedRaw.substring(jsonStart, jsonEnd+1));

            // Find product objects
            const orderItems = (extracted.items||[]).map(itemId => {
              const p = products.find(p => p.id === itemId || p.name.toLowerCase().includes(String(itemId).toLowerCase()));
              return p ? { id:p.id, name:p.name, price:p.price, qty:1, brand:p.brand, ref:p.ref } : null;
            }).filter(Boolean);

            if (orderItems.length === 0 && suggested.length > 0) {
              orderItems.push({ id:suggested[0].id, name:suggested[0].name, price:suggested[0].price, qty:1, brand:suggested[0].brand });
            }

            const subtotal = orderItems.reduce((s,i) => s+(i.price||0)*i.qty, 0);
            pendingOrder = {
              items:   orderItems,
              shipping:{ name:extracted.name||"", phone:extracted.phone||"", address:extracted.address||"", city:extracted.city||"", country:extracted.country||"India" },
              paymentMethod: extracted.payment||"cod",
              subtotal, total:subtotal,
            };

            renderMsg("ai", cleanReply, buildOrderConfirmBox(pendingOrder));
          } else {
            renderMsg("ai", cleanReply, cards);
          }
        } catch(pe) {
          renderMsg("ai", cleanReply, cards);
        }
      } else {
        renderMsg("ai", cleanReply, cards);
      }

    } catch(err) {
      hideTyping();
      renderMsg("ai","I'm having a brief connection issue. Please try again in a moment!");
    }

    document.getElementById("zn-send").disabled = false;
    isTyping = false;
  }

  // ── PUBLIC FUNCTIONS ─────────────────────────────────────────
  window.znToggle = function() {
    isOpen = !isOpen;
    document.getElementById("zn-win").classList.toggle("open", isOpen);
    document.getElementById("zn-icon").textContent  = isOpen ? "✕" : "⌚";
    document.getElementById("zn-notif").style.display = "none";

    if (isOpen && conversation.length === 0) {
      document.getElementById("zn-inp").focus();
      setTimeout(() => {
        renderMsg("ai",
          "Welcome to ZUNITRA ✦ I'm **Zara**, your personal watch advisor.\n\n" +
          "I can help you find the perfect timepiece, answer any questions, and even **place your order directly from this chat**.\n\n" +
          "What are you looking for today?"
        );
        conversation.push({role:"assistant",content:"Welcome! I'm Zara. How can I help you today?"});
        loadProducts();
        getAuth();
      }, 300);
    }
  };

  window.znSend = () => {
    const v = document.getElementById("zn-inp").value.trim();
    if (v) sendMessage(v);
  };

  window.znQ = (t) => sendMessage(t);

  window.znKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.znSend(); }
  };

  window.znResize = (el) => {
    el.style.height = "40px";
    el.style.height = Math.min(el.scrollHeight, 90) + "px";
  };

  // Notification badge after 10s
  setTimeout(() => {
    if (!isOpen) document.getElementById("zn-notif").style.display = "flex";
  }, 10000);

})();
