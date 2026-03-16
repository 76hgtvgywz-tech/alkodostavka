export const config = {
  runtime: 'edge',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Регулярка для мобильных устройств
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
  // Регулярка для поисковых ботов (важно для SEO)
  const isBot = /Googlebot|YandexBot|YandexMobileBot|Bingbot|Baiduspider/i.test(userAgent);

  // Если это НЕ мобила И НЕ бот — блокируем
  if (!isMobile && !isBot) {
    return new Response(
      '<html><body><h1>Доступ с ПК ограничен</h1><p>Сайт открыт только для мобильных устройств.</p></body></html>',
      {
        status: 403,
        headers: { 'content-type': 'text/html' },
      }
    );
  }

  // Иначе пропускаем запрос дальше
  return fetch(request);
}
