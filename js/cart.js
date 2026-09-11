/* ============================
   Cart System — shared across all pages
   Include this file (and css/cart.css) on every page:
   index.html AND every file in pages/*.html
============================ */

/* ---- CONFIG ---- */
/* رقم واتساب الكافيه بالصيغة الدولية بدون + وبدون أصفار زيادة
   مثال ليبيا: 218 + رقم الهاتف بدون الصفر الأول
   مثال: 0912345678  →  218912345678 */
const WHATSAPP_NUMBER = "218942951769"; // TODO: غيّر هذا الرقم لرقم الكافيه الحقيقي

const CART_STORAGE_KEY = "cafeCinnabonCart";

/* ---- STORAGE HELPERS ---- */
function getCart() {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(name, price) {
    const cart = getCart();
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name, price: parseFloat(price), qty: 1 });
    }
    saveCart(cart);
    renderCartModal(); // refresh modal content if it's open
}

function updateQty(name, delta) {
    const cart = getCart();
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(name);
        return;
    }
    saveCart(cart);
    renderCartModal();
}

function removeFromCart(name) {
    let cart = getCart();
    cart = cart.filter(i => i.name !== name);
    saveCart(cart);
    renderCartModal();
}

function clearCart() {
    if (getCart().length === 0) return;
    const confirmed = confirm("هل أنت متأكد إنك عايز تلغي الطلب بالكامل؟");
    if (!confirmed) return;
    saveCart([]);
    renderCartModal();
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

/* ---- UI: FLOATING BUTTON + BADGE ---- */
function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
}

function injectCartUI() {
    // Floating cart button
    const fab = document.createElement("div");
    fab.id = "cart-fab";
    fab.innerHTML = `
        🛒
        <span id="cart-badge"></span>
    `;
    fab.addEventListener("click", openCartModal);
    document.body.appendChild(fab);

    // Modal overlay (hidden by default)
    const overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.innerHTML = `
        <div id="cart-modal">
            <div class="cart-modal-header">
                <h2>سلة الطلبات</h2>
                <button id="cart-close-btn">&times;</button>
            </div>
            <div id="cart-items-list"></div>
            <div id="cart-modal-footer">
                <div id="cart-total-row">
                    <span>الإجمالي</span>
                    <span id="cart-total-value">0.00 د.ل</span>
                </div>
                <button id="cart-send-btn">إرسال الطلب عبر واتساب</button>
                <button id="cart-clear-btn">إلغاء الطلب بالكامل</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById("cart-close-btn").addEventListener("click", closeCartModal);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeCartModal();
    });

    // Send to WhatsApp
    document.getElementById("cart-send-btn").addEventListener("click", sendCartToWhatsApp);

    // Clear whole cart
    document.getElementById("cart-clear-btn").addEventListener("click", clearCart);

    updateCartBadge();
}

function openCartModal() {
    renderCartModal();
    document.getElementById("cart-overlay").classList.add("open");
}

function closeCartModal() {
    document.getElementById("cart-overlay").classList.remove("open");
}

function renderCartModal() {
    const listEl = document.getElementById("cart-items-list");
    const totalEl = document.getElementById("cart-total-value");
    if (!listEl) return; // modal not injected yet

    const cart = getCart();

    if (cart.length === 0) {
        listEl.innerHTML = `<p class="cart-empty-msg">السلة فارغة</p>`;
    } else {
        listEl.innerHTML = cart.map(item => `
            <div class="cart-row" data-name="${item.name}">
                <div class="cart-row-info">
                    <span class="cart-row-name">${item.name}</span>
                    <span class="cart-row-price">${(item.price * item.qty).toFixed(2)} د.ل</span>
                </div>
                <div class="cart-row-controls">
                    <button class="qty-btn qty-minus">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn qty-plus">+</button>
                    <button class="remove-btn">حذف</button>
                </div>
            </div>
        `).join("");

        // Attach handlers for the rows just rendered
        listEl.querySelectorAll(".cart-row").forEach(row => {
            const name = row.dataset.name;
            row.querySelector(".qty-plus").addEventListener("click", () => updateQty(name, 1));
            row.querySelector(".qty-minus").addEventListener("click", () => updateQty(name, -1));
            row.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(name));
        });
    }

    totalEl.textContent = getCartTotal().toFixed(2) + " د.ل";
}

/* ---- SEND TO WHATSAPP ---- */
function sendCartToWhatsApp() {
    const cart = getCart();
    if (cart.length === 0) {
        alert("السلة فارغة، أضف بعض الأصناف أولاً");
        return;
    }

    let message = "طلب جديد من الموقع:%0A%0A";
    cart.forEach(item => {
        message += `${item.name} × ${item.qty} = ${(item.price * item.qty).toFixed(2)} د.ل%0A`;
    });
    message += `%0Aالإجمالي: ${getCartTotal().toFixed(2)} د.ل`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
}

/* ---- WIRE UP "ADD TO CART" BUTTONS ---- */
function wireAddToCartButtons() {
    document.querySelectorAll(".add-to-cart").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.closest("[data-name][data-price]");
            if (!item) return;
            addToCart(item.dataset.name, item.dataset.price);
        });
    });
}

/* ---- INIT ---- */
document.addEventListener("DOMContentLoaded", () => {
    injectCartUI();
    wireAddToCartButtons();
});
