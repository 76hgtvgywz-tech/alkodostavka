// telegram.js
function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ok) console.error('Ошибка Telegram:', data);
    })
    .catch(error => console.error('Ошибка отправки:', error));
}