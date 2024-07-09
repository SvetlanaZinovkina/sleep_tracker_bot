import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';
import knex from './knex.js';
import { I18n } from '@grammyjs/i18n';
import User from './models/User.js';
import SleepRecord from './models/SleepRecord.js';
import setBotCommands from './bot/setCommands.js'
import showStats from './bot/getStats.js';
import { updateSleepRecordTime, showSleepRecordsForDate, handleStartCommand, handleStartSleepCommand, handleEndSleepCommand, handleTextMessage, handleCallbackQuery } from './bot/handlers.js';
import { generateDateKeyboard, generateTimeKeyboard } from './bot/keyboards.js';
import formatDuration from './bot/formatDuration.js';


const bot = new Bot(process.env.BOT_TOKEN);

const i18n = new I18n({
		defaultLocale: "ru",
		directory: "locales",
});

bot.use(i18n);

const userState = new Map();

setBotCommands(bot, i18n).catch(console.error);

bot.command('start', handleStartCommand);

bot.command('start_sleep', handleStartSleepCommand);

bot.command('end_sleep', handleEndSleepCommand);

bot.on('message:text', handleTextMessage);

bot.on('callback_query:data', async (ctx) => {
		try {
				const { data } = ctx.callbackQuery;
				const chatId = ctx.callbackQuery.message.chat.id;
				const state = userState.get(chatId);

				if (data.startsWith('set_date_')) {
						const selectedDate = data.replace('set_date_', '');
						userState.set(chatId, { ...state, selectedDate, stage: 'selectSleepRecord' });
						await showSleepRecordsForDate(ctx, selectedDate);
						return;
				}

				if (data.startsWith('set_sleep_record_')) {
						const recordId = data.replace('set_sleep_record_', '');
						userState.set(chatId, { ...state, recordId, stage: 'selectTime' });
						await ctx.reply('Выберите новое время:', { reply_markup: generateTimeKeyboard() });
						return;
				}

				if (data.startsWith('set_time_')) {
						const newTime = data.replace('set_time_', '');
						await updateSleepRecordTime(ctx, newTime);
						return;
				}

				switch (data) {
						case 'start_sleep':
								const startTime = new Date();
								const button = new InlineKeyboard()
										.text(ctx.t('end-sleep-button'), 'end_sleep');
								const user = await User.findByTelegramId(chatId);
								await SleepRecord.create(user.id, startTime);
								userState.set(chatId, { stage: 'sleeping', userId: user.id, startTime });
								await ctx.reply(ctx.t('start-sleep'), { reply_markup: button });
								break;

						case 'end_sleep':
								const state = userState.get(chatId);
								const buttons = new InlineKeyboard()
										.text(ctx.t('start-sleep-button'), 'start_sleep').row()
										.text(ctx.t('stats-button'), 'stats');
								if (!state || state.stage !== 'sleeping') {
										await ctx.answerCallbackQuery(ctx.t('error-end-sleep'));
										return;
								}
								const endTime = new Date();
								const sleepRecord = await SleepRecord.findByUserId(state.userId);
								await SleepRecord.updateEndTime(sleepRecord.id, endTime);
								const sleepDuration = (endTime - state.startTime) / (1000 * 60);

								const hours = Math.floor(sleepDuration / 60);
								const minutes = Math.round(sleepDuration % 60);

								let durationMessage = '';

								if (hours > 0) {
										durationMessage += ctx.t('hours', { count: hours }) + ' ';
								}
								durationMessage += ctx.t('minutes', { count: minutes });
								await ctx.reply(ctx.t('duration-end-sleep', { duration: durationMessage }), { reply_markup: buttons });
								userState.delete(chatId);
								break;

						case 'stats':
								await showStats(ctx);
								break;

						case 'change_start_time':
								await ctx.reply('Выберите дату начала сна:', { reply_markup: generateDateKeyboard() });
								userState.set(chatId, { stage: 'changeStartTime' });
								break;

						case 'change_end_time':
								await ctx.reply('Выберите дату окончания сна:', { reply_markup: generateDateKeyboard() });
								userState.set(chatId, { stage: 'changeEndTime' });
								break;

						default:
								break;
				}
		} catch (error) {
				console.error('Error in callback_query:data handler:', error);
				await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
		}
});

bot.start();

