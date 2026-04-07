async function sendTelegramMessage(text, retries) {
    retries = retries === undefined ? 3 : retries;
    const url = '/api/send-telegram';
    for (var attempt = 1; attempt <= retries; attempt++) {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 10000);
        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            var result = await response.json();
            if (response.ok && result.success) return { success: true };
            if (attempt === retries) return { success: false, error: result.error };
        } catch (error) {
            clearTimeout(timeoutId);
            if (attempt === retries) return { success: false, error: error.message };
            await new Promise(function(r) { setTimeout(r, 1000 * attempt); });
        }
    }
    return { success: false, error: 'Max retries exceeded' };
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];

let cartPanel, overlay, cartItemsDiv, cartTotalSpan, orderForm;

document.addEventListener('DOMContentLoaded', function() {
    cartPanel = document.getElementById('cart-panel');
    overlay = document.getElementById('overlay');
    cartItemsDiv = document.getElementById('cart-items');
    cartTotalSpan = document.getElementById('cart-total');
    orderForm = document.getElementById('order-form');

    updateCartUI();
    attachCartListeners();
    attachOrderFormListener();
    attachDelegatedClickHandlers();
    attachQuickOrderHandlers();
    initMobileNav();
    runProductGridsInit();

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            window.location.href = 'tel:+79997863967';
        });
    }

    scheduleMetrikaDeferred();
});

function setCartBadges(count) {
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = count;
    });
}

function initMobileNav() {
    const root = document.getElementById('mobile-nav-root');
    const burger = document.querySelector('.js-nav-burger');
    if (!root || !burger) return;

    function setOpen(open) {
        root.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        root.setAttribute('aria-hidden', open ? 'false' : 'true');
        const panel = document.getElementById('mobile-nav-drawer');
        if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.classList.toggle('nav-drawer-open', open);
    }

    burger.addEventListener('click', function(e) {
        e.stopPropagation();
        setOpen(!root.classList.contains('is-open'));
    });

    root.addEventListener('click', function(e) {
        if (e.target.closest('.js-nav-close')) {
            setOpen(false);
            return;
        }
        if (e.target.closest('.mobile-nav__panel a')) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') setOpen(false);
    });
}

function attachDelegatedClickHandlers() {
    document.body.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.add-to-cart');
        if (addBtn) {
            e.preventDefault();
            const productId = parseInt(addBtn.dataset.id, 10);
            const product = typeof products !== 'undefined' ? products.find(p => p.id === productId) : null;
            if (product && product.inStock !== false) {
                addToCart(product);
            }
            return;
        }
        const rm = e.target.closest('.cart-item-remove');
        if (rm) {
            e.preventDefault();
            removeFromCart(parseInt(rm.dataset.id, 10));
        }
    });
}

function attachCartListeners() {
    document.querySelectorAll('.js-cart-toggle').forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (!cartPanel || !overlay) return;
            cartPanel.classList.add('open');
            overlay.classList.add('show');
            var nav = document.getElementById('mobile-nav-root');
            if (nav && nav.classList.contains('is-open')) {
                nav.classList.remove('is-open');
                document.body.classList.remove('nav-drawer-open');
                var b = document.querySelector('.js-nav-burger');
                if (b) b.setAttribute('aria-expanded', 'false');
                nav.setAttribute('aria-hidden', 'true');
                var p = document.getElementById('mobile-nav-drawer');
                if (p) p.setAttribute('aria-hidden', 'true');
            }
        });
    });
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', function() {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

function attachOrderFormListener() {
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitCartOrder();
        });
    }
}

async function submitCartOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();
    const comment = document.getElementById('order-comment').value.trim();

    if (!name || !phone || !address) {
        alert('Заполните имя, телефон и адрес');
        return;
    }
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }

    let itemsList = '';
    let total = 0;
    cart.forEach(function(item) {
        itemsList += `${item.name} x ${item.quantity} = ${item.price * item.quantity} ₽\n`;
        total += item.price * item.quantity;
    });

    const message = `🛒 НОВЫЙ ЗАКАЗ\n\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}\nКомментарий: ${comment || 'нет'}\n\nТовары:\n${itemsList}\nИтого: ${total} ₽`;

    const submitBtn = document.getElementById('submit-order');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
    }

    try {
        if (typeof sendTelegramMessage !== 'function') {
            throw new Error('sendTelegramMessage не определена');
        }
        const result = await sendTelegramMessage(message);
        if (result.success) {
            alert('Заказ отправлен! Ожидайте звонка.');
            cart = [];
            saveCart();
            updateCartUI();
            orderForm.reset();
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        } else {
            alert('Ошибка отправки заказа. Попробуйте позже или позвоните по телефону.');
        }
    } catch (error) {
        alert('Ошибка соединения. Попробуйте позже или позвоните.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Оформить заказ';
        }
    }
}

function addToCart(product) {
    const existing = cart.find(function(item) { return item.id === product.id; });
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(function(item) { return item.id !== productId; });
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartBadges(cart.reduce(function(acc, item) { return acc + item.quantity; }, 0));
}

function updateCartUI() {
    if (!cartItemsDiv || !cartTotalSpan) return;
    const totalQty = cart.reduce(function(acc, item) { return acc + item.quantity; }, 0);
    setCartBadges(totalQty);
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Корзина пуста</p>';
        cartTotalSpan.textContent = 'Итого: 0 ₽';
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach(function(item) {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <div>${item.price} ₽ × ${item.quantity}</div>
                </div>
                <button type="button" class="cart-item-remove" data-id="${item.id}" aria-label="Удалить">×</button>
            </div>
        `;
    });
    cartItemsDiv.innerHTML = html;
    cartTotalSpan.textContent = `Итого: ${total} ₽`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function renderProductGrid(productsArray, options) {
    options = options || {};
    const lcpFirst = !!options.lcpFirst;
    if (!productsArray || !productsArray.length) return '<p>Товары временно отсутствуют</p>';
    return productsArray.map(function(p, index) {
        const inStock = p.inStock !== false;
        const isLcp = lcpFirst && index === 0;
        const imgAttrs = isLcp
            ? 'fetchpriority="high" decoding="async" width="240" height="180" sizes="(max-width:480px) 42vw, 220px"'
            : 'loading="lazy" decoding="async" width="240" height="180" sizes="(max-width:480px) 42vw, 220px"';
        const jpg = escapeHtml(p.image || '');
        return `
            <article class="product-card" data-id="${p.id}" title="${escapeAttr(p.name)}">
                <div class="product-card__media">
                    <img class="product-img" src="${jpg}" alt="${escapeHtml(p.name)}" ${imgAttrs}>
                </div>
                <h3 class="product-title">${escapeHtml(p.name)}</h3>
                <div class="product-price">${p.price} ₽</div>
                ${inStock ?
                    `<button type="button" class="add-to-cart" data-id="${p.id}">В корзину</button>` :
                    `<div class="product-out-stock">Нет в наличии</div>`}
            </article>
        `;
    }).join('');
}

function runProductGridsInit() {
    if (typeof products === 'undefined' || typeof renderProductGrid !== 'function') return;
    var page = document.body.getAttribute('data-page');
    if (page === 'main') {
        var hits = products.filter(function(p) { return p.inStock; }).slice(0, 6);
        var el = document.getElementById('main-products');
        if (el) el.innerHTML = renderProductGrid(hits, { lcpFirst: true });
        return;
    }
    if (page === 'category') {
        var cat = document.body.getAttribute('data-category');
        var grid = document.getElementById('category-products');
        if (grid && cat) {
            var list = products.filter(function(p) { return p.category === cat; });
            grid.innerHTML = renderProductGrid(list, { lcpFirst: true });
        }
    }
}

function scheduleMetrikaDeferred() {
    function init() {
        if (window.ym) return;
        (function(m, e, t, r, i, k, a) {
            m[i] = m[i] || function() { (m[i].a = m[i].a || []).push(arguments); };
            m[i].l = 1 * new Date();
            for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) return;
            }
            k = e.createElement(t);
            a = e.getElementsByTagName(t)[0];
            k.async = 1;
            k.src = r;
            a.parentNode.insertBefore(k, a);
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=107712312', 'ym');
        ym(107712312, 'init', {
            ssr: true,
            webvisor: false,
            clickmap: false,
            ecommerce: 'dataLayer',
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
        });
    }
    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 5000 });
    } else {
        window.addEventListener('load', function() { setTimeout(init, 2500); });
    }
}

function attachQuickOrderHandlers() {
    document.querySelectorAll('.quick-order-form').forEach(function(form) {
        form.addEventListener('submit', handleQuickOrder);
    });
}

function handleQuickOrder(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.querySelector('.quick-name').value.trim();
    const phone = form.querySelector('.quick-phone').value.trim();
    const page = form.dataset.page;

    if (!name || !phone) {
        alert('Введите имя и телефон');
        return;
    }

    const message = `⚡ БЫСТРЫЙ ЗАКАЗ (${page})\nИмя: ${name}\nТелефон: ${phone}`;
    if (typeof sendTelegramMessage === 'function') {
        sendTelegramMessage(message);
    }

    const msgDiv = form.parentElement.querySelector('.order-message');
    if (msgDiv) {
        msgDiv.textContent = 'Заявка отправлена! Скоро перезвоним.';
        setTimeout(function() { msgDiv.textContent = ''; }, 5000);
    }
    form.reset();
}
