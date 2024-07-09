import User from '../models/User.js';
import SleepRecord from '../models/SleepRecord.js';
import { createMainButtons, createEndSleepButton, generateDateKeyboard } from './keyboards.js';
import formatDuration from './formatDuration.js';
import showStats from './getStats.js';

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

export const handleTextMessage = async (ctx) => {
		try {
				const state = userState.get(ctx.chat.id);
				if (state && state.stage === 'askName') {
						const childName = ctx.message.text;
						await User.create(ctx.chat.id, childName);
						await ctx.reply(ctx.t('child-registered'));
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
}
