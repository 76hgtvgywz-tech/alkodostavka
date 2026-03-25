// telegram.js
async function sendTelegramMessage(message, retries = 3) {
  const url = '/api/send-telegram';
  const timeoutMs = 10000; // 10 секунд таймаут

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (response.ok && result.success) {
        console.log('Message sent successfully');
        return { success: true };
      } else {
        console.error(`Attempt ${attempt} failed:`, result.error);
        if (attempt === retries) return { success: false, error: result.error };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Attempt ${attempt} error:`, error);
      if (attempt === retries) return { success: false, error: error.message };
      // ждём перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
