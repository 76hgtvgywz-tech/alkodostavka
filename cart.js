let cart = JSON.parse(localStorage.getItem('cart')) || [];

let cartPanel, overlay, cartCountSpan, cartItemsDiv, cartTotalSpan, orderForm;

document.addEventListener('DOMContentLoaded', function() {
    cartPanel = document.getElementById('cart-panel');
    overlay = document.getElementById('overlay');
    cartCountSpan = document.getElementById('cart-count');
    cartItemsDiv = document.getElementById('cart-items');
    cartTotalSpan = document.getElementById('cart-total');
    orderForm = document.getElementById('order-form');

    updateCartUI();
    attachCartListeners();
    attachOrderFormListener();
    attachAddToCartHandlers();
    attachQuickOrderHandlers();
});

function attachCartListeners() {
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            cartPanel.classList.add('open');
            overlay.classList.add('show');
        });
    }
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

function attachOrderFormListener() {
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitCartOrder();
        });
    }
}

function submitCartOrder() {
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
    cart.forEach(item => {
        itemsList += `${item.name} x ${item.quantity} = ${item.price * item.quantity} ₽\n`;
        total += item.price * item.quantity;
    });

    const message = `🛒 НОВЫЙ ЗАКАЗ\n\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}\nКомментарий: ${comment || 'нет'}\n\nТовары:\n${itemsList}\nИтого: ${total} ₽`;

    if (typeof sendTelegramMessage === 'function') {
        sendTelegramMessage(message);
    } else {
        console.warn('sendTelegramMessage не определён');
    }
    alert('Заказ отправлен! Ожидайте звонка.');

    cart = [];
    saveCart();
    updateCartUI();
    orderForm.reset();
    cartPanel.classList.remove('open');
    overlay.classList.remove('show');
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (cartCountSpan) {
        cartCountSpan.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    }
}

function updateCartUI() {
    if (!cartItemsDiv || !cartTotalSpan || !cartCountSpan) return;
    cartCountSpan.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Корзина пуста</p>';
        cartTotalSpan.textContent = 'Итого: 0 ₽';
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div>${item.price} ₽ x ${item.quantity}</div>
                </div>
                <span class="cart-item-remove" data-id="${item.id}"><i class="fas fa-trash"></i></span>
            </div>
        `;
    });
    cartItemsDiv.innerHTML = html;
    cartTotalSpan.textContent = `Итого: ${total} ₽`;

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            removeFromCart(id);
        });
    });
}

function renderProductGrid(productsArray) {
    if (!productsArray.length) return '<p>Товары временно отсутствуют</p>';
    return productsArray.map(p => {
        const inStock = p.inStock !== false;
        return `
            <div class="product-card" data-id="${p.id}">
                <img class="product-img" src="${p.image || 'https://via.placeholder.com/200x150?text=Alko'}" alt="${p.name}" loading="lazy">
                <div class="product-title">${p.name}</div>
                <div class="product-price">${p.price} ₽</div>
                ${inStock ? 
                    `<button class="add-to-cart" data-id="${p.id}"><i class="fas fa-cart-plus"></i> В корзину</button>` : 
                    `<div style="color: red; font-weight: bold; margin-top: 10px;">Нет в наличии</div>`}
            </div>
        `;
    }).join('');
}

function attachAddToCartHandlers() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.removeEventListener('click', addToCartHandler);
        btn.addEventListener('click', addToCartHandler);
    });
}

function addToCartHandler(e) {
    const productId = parseInt(e.currentTarget.dataset.id);
    const product = products.find(p => p.id === productId);
    if (product && product.inStock !== false) {
        addToCart(product);
    }
}

function attachQuickOrderHandlers() {
    document.querySelectorAll('.quick-order-form').forEach(form => {
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
        setTimeout(() => msgDiv.textContent = '', 5000);
    }
    form.reset();
}
