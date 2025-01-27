import 'dotenv/config';
import { Bot } from 'grammy';
import { I18n } from '@grammyjs/i18n';
import setBotCommands from './bot/setCommands.js'
import showStats from './bot/getStats.js';
import {
		handleStartCommand,
		handleStartSleepCommand,
		handleEndSleepCommand,
		handleTextMessage,
		handleCallbackQuery,
		changeStartTimeCommand,
		changeEndTimeCommand,
		handleDeleteSleepCommand
} from './bot/handlers.js';
import getHelp from './bot/getHelp.js';


const bot = new Bot(process.env.BOT_TOKEN);

const i18n = new I18n({
		defaultLocale: "ru",
		directory: "locales",
});

bot.use(i18n);

setBotCommands(bot, i18n).catch(console.error);

bot.command('start', handleStartCommand);

bot.command('start_sleep', handleStartSleepCommand);

bot.command('end_sleep', handleEndSleepCommand);

bot.command('change_start_time', changeStartTimeCommand);

bot.command('change_end_time', changeEndTimeCommand);

bot.command('delete_sleep', handleDeleteSleepCommand);

bot.command('stats', showStats);

bot.command('how_to_use', getHelp);

bot.on('message:text', handleTextMessage);

bot.on('callback_query:data', handleCallbackQuery);

bot.start();

