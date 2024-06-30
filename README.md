# Sleep Baby Tracker Telegram Bot

Этот проект представляет собой Telegram-бот для отслеживания времени сна ребенка, разработанный с использованием библиотек `grammy` и `mongoose`.

## Описание

Бот позволяет пользователям:
- Начинать отслеживание времени сна
- Завершать отслеживание времени сна
- Просматривать статистику сна за последнюю неделю

## Установка

1. Склонируйте репозиторий на ваш локальный компьютер:

    ```bash
    git clone https://github.com/SvetlanaZinovkina/sleep_tracker_bot
    cd sleepbaby-telegram-bot
    ```

2. Установите зависимости:

    ```bash
    npm install
    ```

3. Создайте файл `.env` в корне проекта и добавьте в него ваш Telegram Bot Token и MongoDB URI:

    ```env
    BOT_TOKEN=your_telegram_bot_token
    MONGO_URI=your_mongodb_uri
    ```

## Запуск

Запустите бота с помощью следующей команды:

```bash
node index.js
