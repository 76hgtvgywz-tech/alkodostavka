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
  cart.forEach(item => {
    itemsList += `${item.name} x ${item.quantity} = ${item.price * item.quantity} ₽\n`;
    total += item.price * item.quantity;
  });

  const message = `🛒 НОВЫЙ ЗАКАЗ\n\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}\nКомментарий: ${comment || 'нет'}\n\nТовары:\n${itemsList}\nИтого: ${total} ₽`;

  const submitBtn = document.getElementById('submit-order');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
  }

  let success = false;
  if (typeof sendTelegramMessage === 'function') {
    const result = await sendTelegramMessage(message);
    success = result.success;
    if (success) {
      alert('Заказ отправлен! Ожидайте звонка.');
      cart = [];
      saveCart();
      updateCartUI();
      orderForm.reset();
      cartPanel.classList.remove('open');
      overlay.classList.remove('show');
    } else {
      alert('Ошибка отправки заказа. Попробуйте позже или позвоните по телефону.');
      console.error('Telegram send error:', result.error);
    }
  } else {
    alert('Ошибка: функция отправки не определена');
    console.error('sendTelegramMessage not found');
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Оформить заказ';
  }
}
