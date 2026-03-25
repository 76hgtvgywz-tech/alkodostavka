// telegram.js
const TELEGRAM_TOKEN = '8427344243:AAFiXfheHb9HmRa2K5MwJR4o7fjXzGRIPa4';
const CHAT_ID = '562345561';

async function sendTelegramMessage(text, retries = 3) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok && result.ok) {
                console.log('Telegram message sent successfully');
                return { success: true };
            } else {
                console.error(`Telegram API error (attempt ${attempt}):`, result);
                if (attempt === retries) return { success: false, error: result };
            }
        } catch (error) {
            console.error(`Network error (attempt ${attempt}):`, error);
            if (attempt === retries) return { success: false, error: error.message };
            // ждём перед повторной попыткой (экспоненциальная задержка)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    return { success: false, error: 'Max retries exceeded' };
}
