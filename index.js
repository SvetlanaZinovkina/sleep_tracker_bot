import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';
import knex from './knex.js';
import { I18n } from '@grammyjs/i18n';
import User from './models/User.js';
import SleepRecord from './models/SleepRecord.js';
import setBotCommands from './bot/setCommands.js'
import showStats from './bot/getStats.js';
import { handleStartCommand, handleStartSleepCommand, handleEndSleepCommand, handleTextMessage, handleCallbackQuery } from './bot/handlers.js';
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

const generateTimeKeyboard = (currentHour, currentMinute) => {
		const keyboard = new InlineKeyboard();
		for (let hour = 0; hour < 24; hour++) {
				keyboard.text(`${hour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`, `set_hour_${hour}`).row();
		}
		for (let minute = 0; minute < 60; minute += 5) {
				keyboard.text(`${currentHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, `set_minute_${minute}`).row();
		}
		return keyboard;
};

const generateDateKeyboard = () => {
		const keyboard = new InlineKeyboard();
		const today = new Date();
		for (let i = 0; i < 7; i++) {
				const date = new Date(today);
				date.setDate(today.getDate() - i);
				const dateString = date.toISOString().split('T')[0];
				keyboard.text(dateString, `set_date_${dateString}`).row();
		}
		return keyboard;
};

// async function showStats(ctx) {
// 		try {
// 				const oneWeekAgo = new Date();
// 				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
//
// 				const user = await User.findByTelegramId(ctx.chat.id);
// 				const records = await knex('sleep_records')
// 						.where({ user_id: user.id })
// 						.andWhere('created_at', '>=', oneWeekAgo);
//
// 				if (records.length === 0) {
// 						await ctx.reply('Записей за последнюю неделю нет.');
// 						return;
// 				}
//
// 				let groupedRecords = {};
//
// 				records.forEach(record => {
// 						const startDate = new Date(record.sleep_start).toLocaleDateString();
// 						if (!groupedRecords[startDate]) {
// 								groupedRecords[startDate] = [];
// 						}
// 						groupedRecords[startDate].push(record);
// 				});
//
// 				let message = 'Статистика сна:\n\n';
//
// 				for (const date in groupedRecords) {
// 						message += `*Дата: ${date}*\n`;
// 						let totalDuration = 0;
//
// 						groupedRecords[date].forEach(record => {
// 								const startTime = new Date(record.sleep_start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
// 								const endTime = new Date(record.sleep_end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
// 								const sleepDuration = (new Date(record.sleep_end) - new Date(record.sleep_start)) / (1000 * 60);
//
// 								totalDuration += sleepDuration;
//
// 								const hours = Math.floor(sleepDuration / 60);
// 								const minutes = Math.round(sleepDuration % 60);
//
// 								let durationMessage = '';
//
// 								if (hours > 0) {
// 										durationMessage += `${hours} ч `;
// 								}
// 								durationMessage += `${minutes} мин`;
//
// 								message += `Начало: ${startTime}\nОкончание: ${endTime}\n_Продолжительность: ${durationMessage}_\n\n`;
// 						});
//
// 						const totalHours = Math.floor(totalDuration / 60);
// 						const totalMinutes = Math.round(totalDuration % 60);
//
// 						let totalDurationMessage = '';
//
// 						if (totalHours > 0) {
// 								totalDurationMessage += `${totalHours} ч `;
// 						}
// 						totalDurationMessage += `${totalMinutes} мин`;
//
// 						message += `_Общая продолжительность: ${totalDurationMessage}_\n\n`;
// 				}
//
// 				await ctx.reply(message, { parse_mode: 'Markdown' });
// 		} catch (error) {
// 				console.error('Error in showStats function:', error);
// 				await ctx.reply('Произошла ошибка при получении статистики. Пожалуйста, попробуйте еще раз.');
// 		}
// }

bot.start();

