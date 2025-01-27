import User from '../models/User.js';
import { InlineKeyboard } from 'grammy';
import SleepRecord from '../models/SleepRecord.js';
import {
		createMainButtons,
		createEndSleepButton,
		generateDateKeyboard,
		generateSleepRecordsKeyboard
} from './keyboards.js';
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
				await SleepRecord.create(user.id, startTime);
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
				await SleepRecord.updateEndTime(sleepRecord.id, endTime);
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

export const updateSleepRecordTime = async (ctx, recordId, newDateTime) => {
		try {
				await SleepRecord.updateStartTime(recordId, newDateTime.toISOString());
				await ctx.reply(ctx.t('change-time', { newTime: newDateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }) }));
				userState.delete(ctx.chat.id);
		} catch (error) {
				console.error('Error in updateSleepRecordTime:', error);
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
				} else if (state && (state.stage === 'changeStartTime' || state.stage === 'changeEndTime')) {
						const [hours, minutes] = ctx.message.text.split(' ').map(Number);
						if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
								const newDateTime = new Date(state.selectedDate);
								newDateTime.setHours(hours);
								newDateTime.setMinutes(minutes);
								if (state.recordId) {
										await updateSleepRecordTime(ctx, state.recordId, newDateTime);
								}
						}} else {
								await ctx.reply(ctx.t('error-time-format'));
						}
		} catch (error) {
				console.error('Error in message:text handler:', error);
				await ctx.reply(ctx.t('error-message'));
		}
}

export const handleDeleteSleepCommand = async (ctx) => {
		const chatId = ctx.chat.id;
		await ctx.reply('Выберите дату сна:', { reply_markup: await generateDateKeyboard(chatId) });
		userState.set(chatId, { stage: 'deleteSleep' });
};

export const handleDelete = async (ctx, recordId) => {
		await SleepRecord.deleteById(Number(recordId));
		await ctx.reply(ctx.t('sleep-deleted'));
};

export const handleCallbackQuery = async (ctx) => {
		try {
				const { data } = ctx.callbackQuery;
				const chatId = ctx.callbackQuery.message.chat.id;
				const state = userState.get(chatId);

				if (data.startsWith('set_delete_sleep_')) {
						const recordId = data.replace('set_delete_sleep_', '');
						await handleDelete(ctx, recordId);
						return;
				}

				if (data.startsWith('set_date_')) {
						const selectedDate = data.replace('set_date_', '');
						userState.set(chatId, { ...state, selectedDate });
						await showSleepRecordsForDate(ctx, selectedDate);
						return;
				}

				if (data.startsWith('set_sleep_record_')) {
						const recordId = data.replace('set_sleep_record_', '');
						userState.set(chatId, { ...state, recordId });
						await ctx.reply(ctx.t('new-time-format'));
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

						case 'delete_sleep':
								await handleDeleteSleepCommand(ctx);
								break;

						default:
								break;
				}
		} catch (error) {
				console.error('Error in callback_query:data handler:', error);
				await ctx.reply(ctx.t('error-message'));
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
				const chatId = ctx.chat.id;
				const state = userState.get(chatId);
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
				const keyboard = generateSleepRecordsKeyboard(sleepRecords, state.stage);

				await ctx.reply('Выберите запись сна:', { reply_markup: keyboard });
		} catch (error) {
				console.error('Error in showSleepRecordsForDate:', error);
				await ctx.reply(ctx.t('error-message'));
		}
};
