# Публикация Дельного камбуза

Приложению достаточно GitHub Pages: все расчёты, избранное и PNG выполняются в браузере, сервер и база данных не нужны.

Репозиторий: https://github.com/iatsuk/deelkombuese

Целевой адрес: https://kombuese.deelstuff.com/

## GitHub

Публичный репозиторий позволяет использовать Pages на GitHub Free. В Settings → Pages выбран источник GitHub Actions. Workflow `.github/workflows/pages.yml` при каждом push в main проверяет синтаксис, запускает тесты, собирает `dist/` и публикует его.

В публикацию попадают только HTML, CSS, JavaScript приложения, шрифты, изображения и правовые страницы. Файлы тестов, скрипты разработки, README и Git не входят в пакет сайта. Относительные пути поддерживают и адрес проекта GitHub Pages, и отдельный поддомен.

## DNS у регистратора

Домен deelstuff.com использует DNS-серверы registrar-servers.com (проверено 25.10.2026). После назначения Custom domain в GitHub у регистратора нужно добавить:

| Поле | Значение |
| --- | --- |
| Type | CNAME |
| Host | kombuese |
| Value / Target | iatsuk.github.io |
| TTL | Automatic или 30 минут |

Адрес назначения не содержит `https://`, пути `/deelkombuese` или других частей URL. Основной сайт deelstuff.com продолжает использовать свои DNS-записи и VPS. Не создавайте wildcard-запись для этого приложения.

В панели Namecheap это обычно Domain List → Manage → Advanced DNS → Host Records. Если уже есть запись с именем kombuese, сначала проверьте её назначение, чтобы не заменить другой сервис.

После появления DNS-записи GitHub проверит домен и выпустит сертификат. Затем в Settings → Pages нужно включить Enforce HTTPS, когда настройка станет доступна. Распространение DNS и подготовка HTTPS могут занять до 24 часов. Пока DNS-запись не добавлена, целевой поддомен не будет открывать приложение.

Проверка:

```sh
dig +short CNAME kombuese.deelstuff.com
# ожидается iatsuk.github.io.
curl -I https://kombuese.deelstuff.com/
```

Для дополнительной защиты домена можно подтвердить владение в Settings аккаунта GitHub → Pages, добавив выданную GitHub TXT-запись. Её значение уникально: выдумывать его нельзя.

## Правовые страницы

`impressum/` и `datenschutz/` относятся именно к этому приложению. Контакты владельца взяты из опубликованного Impressum deelstuff. Datenschutz описывает GitHub Pages, localStorage, Cache Storage, локальный PNG и отсутствие аналитики. Если подключаются новые сервисы, описание обработки данных нужно обновить.

## Источники

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
