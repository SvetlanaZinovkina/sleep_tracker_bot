# [Sleep Baby Tracker Telegram Bot](https://t.me/NapNannyBot)


Этот проект представляет собой Telegram-бот для отслеживания времени сна ребенка, разработанный с использованием библиотек `grammy` и `postgreSQL`. В режиме разработки используется `SQlite3`.

## Описание

Бот позволяет пользователям:
- Начинать отслеживание времени сна
- Завершать отслеживание времени сна
- Просматривать статистику сна за последнюю неделю
- Редактировать начало и окончание сна

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
    DB_CONNECTION=your_postgreSQL_uri
    NODE_ENV=production || development
    ```

## Запуск

Запустите бота с помощью следующей команды:

```bash
nodemon index.js || npm start index.js
