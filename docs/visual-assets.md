# Иллюстрация и пиктограммы

Файл: `assets/galley.png` (1536 × 1024, PNG).

Создан 25 октября 2026 встроенным инструментом Imagegen. На сайт скопирован итоговый PNG; при открытии сайта обращения к генератору нет. Это редакционная иллюстрация, а не фотография готового рецепта и не инструкция по хранению яиц или открытой банки.

Промпт генерации:

> Use case: illustration-story. Asset type: a wide editorial PNG illustration for the Russian yacht cooking website «Дельный камбуз», part of deelstuff. Main request: create a beautifully crafted, warm and legible still-life illustration of practical one-pot cooking aboard a small sailing yacht. Scene: a compact wooden galley worktop, a sturdy forest-green cooking pot with its lid resting beside it, steam subtly rising from a simple rice-and-vegetable dish. Nearby a plain measuring mug, one opened tomato tin, a small glass jar of grains, a closed zip-lock bag of dry oats, a couple of eggs, bread, and an onion. A small round porthole in the background shows a calm sea and a tiny distant sail. Style: refined hand-painted gouache and softly textured editorial illustration, familiar real objects with clear silhouettes, restrained detail; not photorealistic, not 3D, not a UI screenshot. Composition: panoramic landscape around 3:2, centered still life, breathing room around objects, usable as a cropped banner. Palette matches the existing app: warm ivory #f7f5ef, forest green #203e3b, muted olive, terracotta #a3633b, natural light wood, a little sea blue. Lighting: soft daylight, calm practical atmosphere. Text: none. Constraints: no lettering, no logos, no humans or hands, no flames, no refrigerator, no decorative clutter, no invented labels. This is a welcoming editorial image, not a technical cooking diagram.

Пиктограммы действий и продуктов находятся в `src/cooking-visuals.js`, оформление — в `src/visuals.css`. Это векторные рисунки в стиле существующих значков, а не сгенерированный текст. Одна и та же геометрия SVG используется в интерфейсе и через Path2D в PNG-карточке. Значок только помогает найти действие; полный текст шага остаётся обязательным.
