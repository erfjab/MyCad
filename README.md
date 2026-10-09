# MyCad

ویرایشگر ساده‌ی نقشه‌ی معماری، فارسی و راست‌به‌چپ، که کاملا در مرورگر اجرا می‌شود.

A simple Persian (RTL) web CAD for architectural floor plans. It runs entirely in the browser: no server, no account.

## امکانات

- دیوار، خط، شکل‌ها، در و پنجره، پله (مستقیم، L، U، گرد)، آسانسور، پارکینگ، ستون، مبلمان، هاشور، متن و اندازه‌گیری
- طبقات و لایه‌ها، برگشت و دوباره، نسخه‌ی موبایل با لمس
- باز کردن فایل‌های **DWG و DXF** اتوکد (با بلوک‌ها، اندازه‌ها، هاشورها و لایه‌های خود فایل)
- خروجی **PDF و PNG** در مقیاس و اندازه‌ی کاغذ دلخواه، و خروجی **DXF** برای اتوکد
- **ذخیره در مرورگر خود کاربر** (IndexedDB). هیچ داده‌ای به سروری فرستاده نمی‌شود. برای انتقال به دستگاه دیگر یا پشتیبان، از «فایل پشتیبان» (`.mycad`) استفاده کنید.

## اجرا روی کامپیوتر خودتان

بیلد لازم نیست، ولی باید از یک سرور محلی باز شود (باز کردن مستقیم `index.html` با دوبار کلیک، خواننده‌ی DWG را بار نمی‌کند):

```bash
# Python
python -m http.server 8080
# or Node
npx serve .
```

بعد `http://localhost:8080` را باز کنید.

## انتشار روی GitHub Pages

سایت استاتیک است و بیلد ندارد. workflow موجود در `.github/workflows/pages.yml` با هر push روی `master` (یا `main`) سایت را منتشر می‌کند.

یک بار لازم است: در GitHub به **Settings → Pages** بروید و **Source** را روی **GitHub Actions** بگذارید. آدرس سایت: `https://<username>.github.io/MyCad/`

## ساختار

```
index.html            app shell
css/app.css           styles (light/dark, blue theme)
js/base.js            icons, DOM helpers, Persian number formatting
js/catalog.js         tool catalog, defaults, geometry (stairs, shapes, doors…)
js/samples.js         sample plans (10×20 lot: parking + apartment)
js/editor.js          state, view, canvas drawing, snapping, history
js/panels.js          tool cards with live previews
js/export.js          PDF / PNG sheets, DXF writer
js/dwg-import.js      DWG/DXF → MyCad entities (blocks exploded, units guessed)
js/storage.js         IndexedDB projects, autosave, .mycad backups, preferences
js/leftbar.js         file, floors, layers and view panes
js/main.js            pointer, touch, keyboard, startup
lib/libredwg/         DWG reader (WebAssembly, GPL-3.0)
lib/jspdf/            PDF writer (MIT)
```

The scripts are plain (non-module) scripts loaded in order and share one global scope, so there is no build step.

## محدودیت‌های فعلی

- متن‌هایی که با فونت‌های قدیمی ایرانی اتوکد (naskhd، nasim و…) نوشته شده‌اند، فعلا به صورت کادر خط‌چین نشان داده می‌شوند.
- دیوارهای فایل DWG به صورت خط ساده وارد می‌شوند.
