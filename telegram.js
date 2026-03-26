// telegram.js – использует глобальные переменные из config.js
async function sendTelegramMessage(text, retries = 3) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      console.log('Telegram API response:', result);

      if (response.ok && result.ok === true) {
        console.log('✅ Telegram message sent');
        return { success: true };
      } else {
        console.error('❌ Telegram error:', result.description || result);
        if (attempt === retries) {
          return { success: false, error: result.description || 'Telegram API error' };
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
