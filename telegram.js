// telegram.js
async function sendTelegramMessage(text, retries = 3) {
  const url = '/api/send-telegram';  // относительный путь к API

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      console.log('API response:', result);

      if (response.ok && result.success) {
        console.log('✅ Message sent via API');
        return { success: true };
      } else {
        console.error('❌ API error:', result.error);
        if (attempt === retries) return { success: false, error: result.error };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) return { success: false, error: error.message };
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
