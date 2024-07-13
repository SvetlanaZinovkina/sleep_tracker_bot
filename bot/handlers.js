import User from '../models/User.js';
import { InlineKeyboard } from 'grammy';
import SleepRecord from '../models/SleepRecord.js';
import { createMainButtons, createEndSleepButton, generateDateKeyboard } from './keyboards.js';
import { generateTimeKeyboard } from './keyboards.js';
import formatDuration from './formatDuration.js';
import showStats from './getStats.js';
import knex from '../knex.js';

const userState = new Map();

export const handleStartCommand = async (ctx) => {
		try {
				const user = await User.findByTelegramId(ctx.chat.id);
				if (!user) {
						await ctx.reply(ctx.t('hello'));
						userState.set(ctx.chat.id, { stage: 'askName' });
				} else {
						const buttons = createMainButtons(ctx);
						await ctx.reply(ctx.t('select-button'), { reply_markup: buttons });
				}
		} catch (error) {
				console.error('Error in start command:', error);
				await ctx.reply(ctx.t('error-message'));
		}
}

export const handleStartSleepCommand = async (ctx) => {
		try {
				const chatId = ctx.chat.id;
				const startTime = new Date();
				const button = createEndSleepButton(ctx);
				const user = await User.findByTelegramId(chatId);
				await SleepRecord.create(user.id, startTime.toISOString());
				userState.set(chatId, { stage: 'sleeping', userId: user.id, startTime });
				await ctx.reply(ctx.t('start-sleep'), { reply_markup: button });
		} catch (error) {
				console.error('Error in start command:', error);
				await ctx.reply(ctx.t('error-message'));
		}
}

export const handleEndSleepCommand = async (ctx) => {
		try {
				const chatId = ctx.chat.id;
				const state = userState.get(chatId);
				if (!state || state.stage !== 'sleeping') {
						await ctx.reply(ctx.t('error-end-sleep'));
						return;
				}

				const endTime = new Date();
				const sleepRecord = await SleepRecord.findByUserId(state.userId);
				await SleepRecord.updateEndTime(sleepRecord.id, endTime.toISOString());
				const sleepDurationMinutes = (endTime - state.startTime) / (1000 * 60);
				const durationMessage = formatDuration(ctx, sleepDurationMinutes);
				const buttons = createMainButtons(ctx);

				await ctx.reply(ctx.t('duration-end-sleep', { duration: durationMessage }), { reply_markup: buttons });
				userState.delete(chatId);
		} catch (error) {
				console.error('Error in start command:', error);
				await ctx.reply(ctx.t('error-message'));
		}
}

export const handleTextMessage = async (ctx) => {
		try {
				const state = userState.get(ctx.chat.id);
				if (state && state.stage === 'askName') {
						const childName = ctx.message.text;
						await User.create(ctx.chat.id, childName);
						await ctx.reply(ctx.t('child-registered', { childName }));
						userState.delete(ctx.chat.id);

						const buttons = createMainButtons(ctx);
						await ctx.reply(ctx.t('select-button'), { reply_markup: buttons });
				}
		} catch (error) {
				console.error('Error in message:text handler:', error);
				await ctx.reply(ctx.t('error-message'));
		}
}

export const handleCallbackQuery = async (ctx) => {
		try {
				const { data } = ctx.callbackQuery;
				const chatId = ctx.callbackQuery.message.chat.id;
				const state = userState.get(chatId);

				if (data.startsWith('set_date_')) {
						const selectedDate = data.replace('set_date_', '');
						userState.set(chatId, { ...state, selectedDate });
						await showSleepRecordsForDate(ctx, selectedDate);
						return;
				}

				if (data.startsWith('set_sleep_record_')) {
						const recordId = data.replace('set_sleep_record_', '');
						userState.set(chatId, { ...state, recordId });
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
								await handleStartSleepCommand(ctx);
								break;

						case 'end_sleep':
								await handleEndSleepCommand(ctx);
								break;

						case 'stats':
								await showStats(ctx);
								break;

						case 'change_start_time':
								userState.set(chatId, { ...state, stage: 'changeStartTime' });
								await changeStartTimeCommand(ctx);
								break;

						case 'change_end_time':
								userState.set(chatId, { ...state, stage: 'changeEndTime' });
								await changeEndTimeCommand(ctx);
								break;

						default:
								break;
				}
		} catch (error) {
				console.error('Error in callback_query:data handler:', error);
				await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
		}
};

export const changeStartTimeCommand =  async (ctx) => {
		const chatId = ctx.chat.id;
		await ctx.reply('Выберите дату начала сна:', { reply_markup: await generateDateKeyboard(chatId) });
		const state = userState.get(chatId);
		userState.set(chatId, { ...state, stage: 'changeStartTime' });
};

export const changeEndTimeCommand =  async (ctx) => {
		const chatId = ctx.chat.id;
		await ctx.reply('Выберите дату окончания сна:', { reply_markup: await generateDateKeyboard(chatId) });
		const state = userState.get(chatId);
		userState.set(chatId, { ...state, stage: 'changeEndTime' });
};

export const showSleepRecordsForDate = async (ctx, date) => {
		try {
				const user = await User.findByTelegramId(ctx.chat.id);
				if (!user) {
						await ctx.reply(ctx.t('error-message'));
						return;
				}

				const startDate = new Date(date);
				startDate.setHours(0, 0, 0, 0);
				const endDate = new Date(date);
				endDate.setHours(23, 59, 59, 999);
				// endDate.setDate(endDate.getDate() + 1);

				const sleepRecords = await knex('sleep_records')
						.where({ user_id: user.id })
						.andWhere('sleep_start', '>=', startDate.toISOString())
						.andWhere('sleep_start', '<', endDate.toISOString());

				if (!sleepRecords.length) {
						await ctx.reply('Записей за выбранный день нет.');
						return;
				}
				console.log(sleepRecords)
				const keyboard = new InlineKeyboard();
				sleepRecords.forEach(record => {
						const startTime = new Date(record.sleep_start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
						const endTime = record.sleep_end ? new Date(record.sleep_end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }) : '---';
						keyboard.text(`${startTime} - ${endTime}`, `set_sleep_record_${record.id}`).row();
				});

				await ctx.reply('Выберите запись сна:', { reply_markup: keyboard });
		} catch (error) {
				console.error('Error in showSleepRecordsForDate:', error);
				await ctx.reply(ctx.t('error-message'));
		}
};

export const updateSleepRecordTime = async (ctx, newTime) => {
		try {
				const chatId = ctx.chat.id;
				const state = userState.get(chatId);

				if (!state || !state.recordId) {
						await ctx.reply(ctx.t('error-message'));
						return;
				}

				const [hours, minutes] = newTime.split(':').map(Number);
				const newDateTime = new Date(state.selectedDate);
				newDateTime.setHours(hours);
				newDateTime.setMinutes(minutes);
				let updatedRecord;
				console.log(state);
				if (state.stage === 'changeStartTime') {
						await SleepRecord.updateStartTime(state.recordId, newDateTime.toISOString());
						updatedRecord = await SleepRecord.findById(state.recordId);
						await ctx.reply(`Начало сна успешно обновлено на: ${newTime}`);
				} else if (state.stage === 'changeEndTime') {
						await SleepRecord.updateEndTime(state.recordId, newDateTime.toISOString());
						updatedRecord = await SleepRecord.findById(state.recordId);
						await ctx.reply(`Окончание сна успешно обновлено на: ${newTime}`);
				}

				userState.delete(chatId);
		} catch (error) {
				console.error('Error in updateSleepRecordTime:', error);
				await ctx.reply(ctx.t('error-message'));
		}
};
