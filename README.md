# CHABADA — site web

> **Важно:** почта блокирует `.js` в архивах, поэтому файл переименован.
> Перед запуском переименуйте `script.js.txt` → `script.js`.

Bar · Restaurant · Cocktails — 39 Rue de Gand, Lille.

Статичный сайт: чистые HTML / CSS / JS, без сборки и без зависимостей.
Дизайн — Figma: https://www.figma.com/design/j4XbDjerU93ZSiuallP7sc/restaurant
Текущая версия: https://chabada.vercel.app

## Запуск локально

```
python3 -m http.server 8000
```
и открыть http://localhost:8000

## Структура

| Файл | Страница |
|---|---|
| `index.html` | Accueil — hero, Infos Pratiques, Notre Carte |
| `carte.html` | La Carte — меню с вкладками и поиском |
| `galerie.html` | Galerie — 20 фото ресторана |
| `avis.html` | Mots Doux — отзывы |
| `contact.html` | Contact — карта, форма, часы |
| `reserver.html` | Réserver — «Bientôt à Lille» |
| `styles.css` | Все стили; цвета и шрифты — переменные в `:root` |
| `script.js` | Мобильное меню, анимации появления, вкладки/поиск меню, демо-формы |
| `images/` | Фото ресторана, сжатые для веба (~100–250 КБ) |
| `logo.png`, `favicon.png` | Логотип-печать |
| `vercel.json` | Настройки Vercel (чистые URL) |

Шрифты: Playfair Display, Inter, Great Vibes (Google Fonts).
Цвета: фон `#F1ECE2`, акцент `#E89211`.

## Деплой

```
vercel deploy --prod
```
Или любой статический хостинг (Netlify, OVH, и т.д.) — просто залить папку.

## Что нужно доделать

- **Формы не отправляются.** Contact, Réserver и форма на главной — демо (`form[data-demo]` в `script.js`). Нужно подключить отправку (Formspree, Netlify Forms, бэкенд или сервис бронирования).
- **Телефон** `+33 3 20 00 00 00` — заглушка, заменить на реальный (во всех футерах и на странице Contact).
- **Соцсети** — ссылки Instagram / Facebook / Google Maps и «Mentions Légales», «Politique de Confidentialité», «Laisser un avis» ведут на `#`.
- **Меню** (`carte.html`) — блюда и цены взяты из макета, сверить с актуальной картой.
- **«Ouvert maintenant»** — статичный текст, не зависит от времени.
- **Отзывы** — примеры, заменить на реальные (или подключить Google Reviews).
- **Десерты** — нет фото десерта; на главной вместо карточки «Desserts» стоит «Vins».
- **Мобильная версия** — адаптивная, но не 1:1 с мобильными макетами Figma.
- Оригиналы фото в полном разрешении — у заказчика (WeTransfer).
