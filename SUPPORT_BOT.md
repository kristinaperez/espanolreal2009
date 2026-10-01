# Español Real Support Bot

The project now contains two support paths:

1. **In-app feedback** — `💬 Обратная связь` and `⚠️ Ошибка в карточке?` send a structured message to the developer through the support bot.
2. **Telegram support bot** — `@EspanolRealSupportBot` shows `Ошибка / Предложение / Вопрос`, asks for one reply, and forwards it to the developer with Telegram ID and lesson/card context when available.

## Netlify environment variables

Add these variables in Netlify (Site configuration → Environment variables):

```text
TELEGRAM_SUPPORT_BOT_TOKEN=<token from BotFather>
TELEGRAM_SUPPORT_BOT_USERNAME=EspanolRealSupportBot
NEXT_PUBLIC_TELEGRAM_SUPPORT_BOT_USERNAME=EspanolRealSupportBot
TELEGRAM_SUPPORT_WEBHOOK_SECRET=<random secret at least 32 bytes>
TELEGRAM_SUPPORT_ADMIN_CHAT_ID=<your Telegram chat id; add after /id step below>
```

`ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL` and the existing application variables remain unchanged.

## Register the support webhook

After the first deploy, call:

```bash
curl -X POST "https://YOUR-DOMAIN/api/telegram/support/setup" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET"
```

Then open `@EspanolRealSupportBot` in Telegram and send:

```text
/id
```

The bot will reply with your chat ID. Put that value in `TELEGRAM_SUPPORT_ADMIN_CHAT_ID` in Netlify and redeploy.

You can call `/api/telegram/support/setup` again after a domain or webhook-secret change.

## What the developer receives

Example:

```text
🇪🇸 Español Real · Support
🐛 Type: BUG
Source: Web / Mini App

User: Kristina
Username: @...
Telegram ID: 123456789
Lesson: 7
Card: 47
Exercise: choice
Phrase: Tengo que irme.
Translation: Мне нужно идти.
Issue: Неправильный перевод
URL: /lesson/7

Message:
Карточка засчиталась неправильно
```

The bot token never reaches client-side JavaScript. The browser sends feedback to the application's server endpoint, and only the server calls the Telegram Bot API.
