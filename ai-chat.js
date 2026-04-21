/**
 * ZUNITRA AI Shopping Assistant
 * Add this ONE line to any page just before </body>:
 *   <script src="ai-chat.js"></script>
 *
 * Powered by Groq llama-3.3-70b
 * Features: product recommendations, luxury advisor, Firestore product search
 */
(function() {
  "use strict";

  // ── CONFIG ────────────────────────────────────────────────
  const GROQ_KEY   = "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";
  const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODEL = "llama-3.3-70b-versatile";
  const USD_TO_INR = 83.5;
  const MAX_HISTORY = 12; // keep last 12 messages in context

  // ── STATE ─────────────────────────────────────────────────
  let isOpen       = false;
  let isTyping     = false;
  let products     = [];       // loaded from Firebase
  let conversation = [];       // full chat history
  let productsLoaded = false;

  // ── INJECT STYLES ─────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    /* Chat toggle button */
    #zn-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9000;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #9A7A2E, #C9A84C);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(201,168,76,0.4);
      transition: all 0.3s ease;
      font-size: 24px;
    }
    #zn-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(201,168,76,0.6);
    }
    #zn-chat-btn .zn-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #C0392B;
      color: white;
      font-size: 9px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Montserrat', sans-serif;
    }

    /* Chat window */
    #zn-chat-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 8999;
      width: 380px;
      height: 580px;
      background: #0F0F0F;
      border: 1px solid rgba(201,168,76,0.25);
      box-shadow: 0 20px 80px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: bottom right;
    }
    #zn-chat-window.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Header */
    .zn-header {
      background: linear-gradient(135deg, #141414, #1A1A1A);
      border-bottom: 1px solid rgba(201,168,76,0.15);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .zn-avatar {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #9A7A2E, #C9A84C);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .zn-header-info { flex: 1 }
    .zn-header-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 17px;
      font-weight: 400;
      color: #F5F0E8;
      line-height: 1;
      margin-bottom: 3px;
    }
    .zn-header-status {
      font-size: 10px;
      letter-spacing: 1px;
      color: #27AE60;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .zn-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #27AE60;
      animation: znPulse 2s infinite;
    }
    @keyframes znPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .zn-close-btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.1);
      color: #666;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      font-family: sans-serif;
    }
    .zn-close-btn:hover { border-color: #C9A84C; color: #C9A84C; }

    /* Messages area */
    .zn-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }
    .zn-messages::-webkit-scrollbar { width: 3px; }
    .zn-messages::-webkit-scrollbar-thumb { background: #333; }

    /* Message bubbles */
    .zn-msg {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      animation: znFadeUp 0.3s ease;
    }
    @keyframes znFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .zn-msg.user { flex-direction: row-reverse; }
    .zn-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    }
    .zn-msg.ai .zn-msg-avatar { background: linear-gradient(135deg,#9A7A2E,#C9A84C); }
    .zn-msg.user .zn-msg-avatar { background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); }
    .zn-bubble {
      max-width: 78%;
      padding: 10px 14px;
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      line-height: 1.7;
      color: #F5F0E8;
    }
    .zn-msg.ai .zn-bubble {
      background: #141414;
      border: 1px solid rgba(255,255,255,0.08);
      border-bottom-left-radius: 0;
    }
    .zn-msg.user .zn-bubble {
      background: linear-gradient(135deg, #9A7A2E, #C9A84C);
      color: #080808;
      border-bottom-right-radius: 0;
    }
    .zn-msg-time {
      font-size: 9px;
      color: #555;
      margin-top: 4px;
      text-align: right;
      font-family: 'Montserrat', sans-serif;
    }

    /* Product cards in chat */
    .zn-product-card {
      background: #1A1A1A;
      border: 1px solid rgba(201,168,76,0.2);
      padding: 12px;
      margin-top: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
      display: flex;
      gap: 12px;
      align-items: center;
      text-decoration: none;
    }
    .zn-product-card:hover { border-color: rgba(201,168,76,0.5); }
    .zn-product-img {
      width: 56px;
      height: 56px;
      background: radial-gradient(circle at 50% 40%, #181818, #0a0a0a);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      opacity: 0.5;
      overflow: hidden;
    }
    .zn-product-img img { width: 100%; height: 100%; object-fit: cover; opacity: 1; }
    .zn-product-info { flex: 1; min-width: 0; }
    .zn-product-brand { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 2px; font-family: 'Montserrat', sans-serif; }
    .zn-product-name { font-family: 'Cormorant Garamond', serif; font-size: 15px; color: #F5F0E8; line-height: 1.2; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zn-product-price { font-family: 'Cormorant Garamond', serif; font-size: 16px; color: #C9A84C; }
    .zn-product-price small { font-family: 'Montserrat', sans-serif; font-size: 9px; color: #666; display: block; }
    .zn-view-btn { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #C9A84C; background: none; border: 1px solid rgba(201,168,76,0.3); padding: 4px 10px; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.2s; white-space: nowrap; }
    .zn-view-btn:hover { background: rgba(201,168,76,0.1); }

    /* Typing indicator */
    .zn-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 10px 14px;
      background: #141414;
      border: 1px solid rgba(255,255,255,0.08);
      width: fit-content;
    }
    .zn-typing span {
      width: 6px; height: 6px;
      background: #C9A84C;
      border-radius: 50%;
      animation: znBounce 1.2s infinite;
    }
    .zn-typing span:nth-child(2) { animation-delay: 0.2s; }
    .zn-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes znBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* Quick replies */
    .zn-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 16px 10px;
    }
    .zn-qr {
      background: none;
      border: 1px solid rgba(201,168,76,0.3);
      color: #C9A84C;
      font-size: 10px;
      letter-spacing: 1px;
      padding: 6px 12px;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      transition: all 0.2s;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .zn-qr:hover { background: rgba(201,168,76,0.1); }

    /* Input area */
    .zn-input-area {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 12px 14px;
      display: flex;
      gap: 10px;
      align-items: flex-end;
      flex-shrink: 0;
      background: #0F0F0F;
    }
    .zn-input {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      color: #F5F0E8;
      padding: 10px 13px;
      font-size: 12px;
      font-family: 'Montserrat', sans-serif;
      outline: none;
      resize: none;
      min-height: 40px;
      max-height: 100px;
      line-height: 1.5;
      transition: border-color 0.3s;
    }
    .zn-input:focus { border-color: rgba(201,168,76,0.4); }
    .zn-input::placeholder { color: #555; }
    .zn-send-btn {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #9A7A2E, #C9A84C);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
      font-size: 16px;
    }
    .zn-send-btn:hover { background: linear-gradient(135deg, #C9A84C, #E8C96A); }
    .zn-send-btn:disabled { opacity: 0.4; pointer-events: none; }

    /* Powered by */
    .zn-powered {
      text-align: center;
      font-size: 9px;
      color: #333;
      font-family: 'Montserrat', sans-serif;
      letter-spacing: 1px;
      padding: 4px 0 10px;
    }

    /* Mobile */
    @media(max-width: 480px) {
      #zn-chat-window {
        width: calc(100vw - 20px);
        right: 10px;
        bottom: 90px;
        height: 70vh;
      }
      #zn-chat-btn { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── BUILD HTML ────────────────────────────────────────────
  const container = document.createElement("div");
  container.innerHTML = `
    <!-- Toggle button -->
    <button id="zn-chat-btn" onclick="znToggleChat()" title="Chat with Zara - AI Advisor">
      <span id="zn-btn-icon">⌚</span>
      <span class="zn-badge" id="zn-badge" style="display:none">1</span>
    </button>

    <!-- Chat window -->
    <div id="zn-chat-window">
      <div class="zn-header">
        <div class="zn-avatar">✦</div>
        <div class="zn-header-info">
          <div class="zn-header-name">Zara — Zunitra Advisor</div>
          <div class="zn-header-status">
            <div class="zn-status-dot"></div>
            Available now · AI Powered
          </div>
        </div>
        <button class="zn-close-btn" onclick="znToggleChat()">✕</button>
      </div>

      <div class="zn-messages" id="zn-messages"></div>

      <div class="zn-quick-replies" id="zn-quick-replies">
        <button class="zn-qr" onclick="znSendQuick('Show me luxury watches')">Luxury</button>
        <button class="zn-qr" onclick="znSendQuick('I have a budget of $1000')">Under $1000</button>
        <button class="zn-qr" onclick="znSendQuick('I need a gift for him')">Gift Ideas</button>
        <button class="zn-qr" onclick="znSendQuick('What are your best sport watches?')">Sport</button>
        <button class="zn-qr" onclick="znSendQuick('Show me limited editions')">Limited</button>
      </div>

      <div class="zn-input-area">
        <textarea
          class="zn-input"
          id="zn-input"
          placeholder="Ask me anything about our watches..."
          rows="1"
          onkeydown="znHandleKey(event)"
          oninput="znAutoResize(this)"
        ></textarea>
        <button class="zn-send-btn" id="zn-send-btn" onclick="znSend()">➤</button>
      </div>
      <div class="zn-powered">✦ Powered by Groq AI · ZUNITRA</div>
    </div>
  `;
  document.body.appendChild(container);

  // ── LOAD PRODUCTS FROM FIREBASE ───────────────────────────
  async function loadProducts() {
    if (productsLoaded) return;
    try {
      // Use Firebase if available on page
      if (typeof window._zunitraDb !== "undefined") {
        const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const snap = await getDocs(collection(window._zunitraDb, "products"));
        products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        productsLoaded = true;
        return;
      }
      // Fallback: try to get from window if already loaded on page
      if (window._zunitraProducts && window._zunitraProducts.length) {
        products = window._zunitraProducts;
        productsLoaded = true;
        return;
      }
      // Last resort: fetch Firebase directly
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const { getFirestore, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const firebaseConfig = {
        apiKey: "AIzaSyDlqviz3CSecuxvRe_IYOKFNFFFLx7_KYs",
        authDomain: "zunitra.firebaseapp.com",
        projectId: "zunitra",
        storageBucket: "zunitra.firebasestorage.app",
        messagingSenderId: "28187912461",
        appId: "1:28187912461:web:3ff878061a9d866a5ce844"
      };
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db  = getFirestore(app);
      const snap = await getDocs(collection(db, "products"));
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      productsLoaded = true;
    } catch(e) {
      console.warn("Zara: Could not load products", e);
    }
  }

  // ── PRODUCT SEARCH ────────────────────────────────────────
  function searchProducts(query, limit) {
    limit = limit || 3;
    if (!products.length) return [];
    const q = query.toLowerCase();

    // Score each product
    const scored = products.map(p => {
      let score = 0;
      const name     = (p.name     || "").toLowerCase();
      const brand    = (p.brand    || "").toLowerCase();
      const desc     = (p.desc     || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const price    = p.price || 0;

      if (name.includes(q))      score += 10;
      if (brand.includes(q))     score += 8;
      if (desc.includes(q))      score += 5;
      if (category.includes(q))  score += 6;

      // Budget matching
      const budgetMatch = q.match(/\$?(\d+[,\d]*)/);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1].replace(",",""));
        if (price <= budget * 1.1) score += 7;
        if (price >= budget * 0.7 && price <= budget * 1.1) score += 5;
      }

      // Category keywords
      if ((q.includes("sport") || q.includes("dive") || q.includes("diver")) && category === "sport") score += 8;
      if ((q.includes("dress") || q.includes("formal") || q.includes("office")) && category === "dress") score += 8;
      if ((q.includes("limited") || q.includes("rare") || q.includes("collector")) && category === "limited") score += 8;
      if ((q.includes("automatic") || q.includes("mechanical") || q.includes("complication")) && category === "complications") score += 8;
      if (q.includes("gift") || q.includes("him") || q.includes("her")) score += 3;
      if ((q.includes("luxury") || q.includes("premium")) && price > 1000) score += 4;
      if ((q.includes("affordable") || q.includes("budget") || q.includes("cheap")) && price < 1000) score += 4;

      return { ...p, score };
    });

    return scored
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── BUILD PRODUCT SUMMARY FOR AI CONTEXT ──────────────────
  function buildProductContext() {
    if (!products.length) return "No products currently loaded.";
    return products.slice(0, 20).map(p =>
      `- ${p.name} by ${p.brand} | $${p.price} (₹${Math.round(p.price*USD_TO_INR).toLocaleString("en-IN")}) | Category: ${p.category} | ${p.desc || ""} | ID: ${p.id}`
    ).join("\n");
  }

  // ── CALL GROQ ─────────────────────────────────────────────
  async function callGroq(messages) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + GROQ_KEY,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.7,
        max_tokens:  600,
        messages:    messages,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "AI error");
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // ── RENDER A MESSAGE ──────────────────────────────────────
  function renderMessage(role, text, recommendedProducts) {
    const msgsEl = document.getElementById("zn-messages");
    const msgEl  = document.createElement("div");
    msgEl.className = "zn-msg " + (role === "user" ? "user" : "ai");

    const time = new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

    // Format text - convert **bold** and newlines
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    const avatarIcon = role === "user" ? "👤" : "✦";

    msgEl.innerHTML = `
      <div class="zn-msg-avatar">${avatarIcon}</div>
      <div>
        <div class="zn-bubble">${formatted}</div>
        ${recommendedProducts && recommendedProducts.length ? renderProductCards(recommendedProducts) : ""}
        <div class="zn-msg-time">${time}</div>
      </div>
    `;

    msgsEl.appendChild(msgEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function renderProductCards(prods) {
    return prods.map(p => {
      const inr = Math.round((p.price||0) * USD_TO_INR).toLocaleString("en-IN");
      const imgHtml = p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}">`
        : "⌚";
      return `<a class="zn-product-card" href="product.html?id=${p.id}">
        <div class="zn-product-img">${imgHtml}</div>
        <div class="zn-product-info">
          <div class="zn-product-brand">${p.brand || "Zunitra"}</div>
          <div class="zn-product-name">${p.name}</div>
          <div class="zn-product-price">$${(p.price||0).toLocaleString()}<small>₹${inr}</small></div>
        </div>
        <button class="zn-view-btn" onclick="event.preventDefault();location.href='product.html?id=${p.id}'">View</button>
      </a>`;
    }).join("");
  }

  // ── TYPING INDICATOR ──────────────────────────────────────
  function showTyping() {
    const msgsEl = document.getElementById("zn-messages");
    const el = document.createElement("div");
    el.className = "zn-msg ai";
    el.id = "zn-typing-indicator";
    el.innerHTML = `
      <div class="zn-msg-avatar">✦</div>
      <div class="zn-typing"><span></span><span></span><span></span></div>
    `;
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById("zn-typing-indicator");
    if (el) el.remove();
  }

  // ── SEND MESSAGE ──────────────────────────────────────────
  async function sendMessage(userText) {
    if (!userText.trim() || isTyping) return;
    isTyping = true;

    // Hide quick replies after first interaction
    document.getElementById("zn-quick-replies").style.display = "none";

    // Show user message
    renderMessage("user", userText);
    conversation.push({ role: "user", content: userText });

    // Disable input
    document.getElementById("zn-send-btn").disabled = true;
    document.getElementById("zn-input").value = "";
    document.getElementById("zn-input").style.height = "40px";

    showTyping();

    // Load products if not loaded
    if (!productsLoaded) await loadProducts();

    // Find relevant products
    const suggested = searchProducts(userText, 3);

    // Build system context
    const systemMsg = {
      role: "system",
      content: `You are Zara, a sophisticated and knowledgeable luxury watch advisor for ZUNITRA, India's premier luxury watch e-commerce store. You help customers find their perfect timepiece.

Your personality:
- Warm, elegant, and knowledgeable about luxury watches
- Speak like a high-end boutique advisor, not a chatbot
- Brief and helpful responses (2-4 sentences max per reply)
- Use watch terminology naturally (calibre, complication, bezel, movement, etc.)
- Occasionally use French/Italian watch terms (tourbillon, perpetuelle, etc.)

Store info: ZUNITRA sells luxury timepieces from $200 to $50,000. Fine Swiss and international brands. Est. 1847 Geneva.

AVAILABLE PRODUCTS IN STORE:
${buildProductContext()}

Rules:
- When recommending products, mention them by name naturally in your response
- If customer asks for recommendations, suggest 1-3 specific products from the list above
- If a customer has a budget, prioritize products in that range
- Keep responses under 100 words
- End responses with a question to keep conversation going
- If asked about a product not in the store, say it's not currently available but suggest alternatives
- NEVER make up products that aren't in the list above`
    };

    // Build messages array (system + last N turns)
    const recentHistory = conversation.slice(-MAX_HISTORY);
    const messages = [systemMsg, ...recentHistory];

    try {
      const reply = await callGroq(messages);
      hideTyping();

      // Add to conversation history
      conversation.push({ role: "assistant", content: reply });

      // Show AI response with product cards
      renderMessage("ai", reply, suggested);

    } catch(err) {
      hideTyping();
      renderMessage("ai", "I'm having a brief connection issue. Please try again in a moment — I'd love to help you find the perfect timepiece.");
      conversation.push({ role: "assistant", content: "Connection error" });
    }

    document.getElementById("zn-send-btn").disabled = false;
    isTyping = false;
  }

  // ── PUBLIC API ────────────────────────────────────────────
  window.znToggleChat = function() {
    isOpen = !isOpen;
    const win    = document.getElementById("zn-chat-window");
    const btnIcon = document.getElementById("zn-btn-icon");
    const badge  = document.getElementById("zn-badge");

    if (isOpen) {
      win.classList.add("open");
      btnIcon.textContent = "✕";
      badge.style.display = "none";
      document.getElementById("zn-input").focus();

      // Send welcome message if first open
      if (conversation.length === 0) {
        setTimeout(() => {
          renderMessage("ai",
            "Welcome to ZUNITRA ✦ I'm Zara, your personal watch advisor. Whether you're looking for a gift, a statement piece, or your first luxury watch — I'm here to guide you.\n\nWhat brings you in today?"
          );
          conversation.push({
            role: "assistant",
            content: "Welcome to ZUNITRA ✦ I'm Zara, your personal watch advisor. What brings you in today?"
          });
        }, 300);

        // Load products in background
        loadProducts();
      }
    } else {
      win.classList.remove("open");
      btnIcon.textContent = "⌚";
    }
  };

  window.znSend = function() {
    const input = document.getElementById("zn-input");
    const text = input.value.trim();
    if (text) sendMessage(text);
  };

  window.znSendQuick = function(text) {
    sendMessage(text);
  };

  window.znHandleKey = function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      window.znSend();
    }
  };

  window.znAutoResize = function(el) {
    el.style.height = "40px";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  // Show notification badge after 8 seconds
  setTimeout(() => {
    if (!isOpen) {
      document.getElementById("zn-badge").style.display = "flex";
    }
  }, 8000);

})();
