// api/send-telegram.js
export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const TELEGRAM_TOKEN = '8427344243:AAFiXfheHb9HmRa2K5MwJR4o7fjXzGRIPa4';
  const CHAT_ID = '562345561';  // замените на правильный ID группы или пользователя

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (response.ok && data.ok) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Telegram API error:', data);
      return res.status(500).json({ success: false, error: data.description || 'Telegram error' });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
