import 'dotenv/config';
import { Bot, Context, InlineKeyboard } from 'grammy';
import mongoose from 'mongoose';
import SleepRecord from './models/SleepRecord.js';

const bot = new Bot(process.env.BOT_TOKEN);

mongoose.connect(process.env.MONGO_URI)
		.then(() => console.log('MongoDB connected'))
		.catch(err => console.error('MongoDB connection error:', err));

const userState = new Map();

bot.api.setMyCommands([
		{
				command: 'start',
				description: 'Запуск бота'
		},
		{
				command: 'start_sleep',
				description: 'Начало сна'
		},
		{
				command: 'end_sleep',
				description: 'Окончание сна'
		},
		{
				command: 'stats',
				description: 'Статистика'
		}
])

bot.command('start', async (ctx) => {
		// await ctx.reply('Привет! Как зовут ребенка?');
		// userState.set(ctx.chat.id, { stage: 'askName' });
		const buttons = new InlineKeyboard()
				.text('Начало сна', 'start_sleep').row()
				.text('Окончание сна', 'end_sleep').row()
				.text('Статистика', 'stats').row();

		await ctx.reply('Выберите действие:', { reply_markup: buttons });
});

bot.command('start_sleep', async (ctx) => {
		const chatId = ctx.chat.id;
		const startTime = new Date();
		const button = new InlineKeyboard()
				.text('Окончание сна', 'end_sleep');
		userState.set(chatId, { stage: 'sleeping', startTime });
		// await ctx.answerCallbackQuery('Время начала сна сохранено.');
		await ctx.reply('Сон начат. Теперь вы можете нажать кнопку "Окончание сна", когда сон закончится.', { reply_markup: button });

});

bot.command('end_sleep', async (ctx) => {
		const chatId = ctx.callbackQuery.message.chat.id;
		const { data } = ctx.callbackQuery;

		const buttons = new InlineKeyboard()
				.text('Начало сна', 'start_sleep').row()
				.text('Статистика', 'stats');
		const state = userState.get(chatId);
		if (!state || state.stage !== 'sleeping') {
				await ctx.answerCallbackQuery('Сначала начните сон кнопкой "Начало сна".');
				return;
		}
		const endTime = new Date();
		const sleepTime = endTime.getTime() - state.startTime.getTime();
		const hours = Math.floor(sleepTime / (1000 * 60 * 60));
		const minutes = Math.floor((sleepTime % (1000 * 60 * 60)) / (1000 * 60));
		await ctx.reply(`Сон закончен. Прошло времени: ${hours} ч. ${minutes} мин.`
	, { reply_markup: buttons });
		await saveSleepRecord(chatId, state.startTime, endTime);
		userState.delete(chatId);
});

bot.on('callback_query:data', async (ctx) => {
		const { data } = ctx.callbackQuery;
		const chatId = ctx.callbackQuery.message.chat.id;

		switch (data) {
				case 'start_sleep':
						const startTime = new Date();
						const button = new InlineKeyboard()
								.text('Окончание сна', 'end_sleep');
						userState.set(chatId, { stage: 'sleeping', startTime });
						await ctx.answerCallbackQuery('Время начала сна сохранено.');
						await ctx.reply('Сон начат. Теперь вы можете нажать кнопку "Окончание сна", когда сон закончится.', { reply_markup: button });
						break;
				case 'end_sleep':
						const state = userState.get(chatId);
						const buttons = new InlineKeyboard()
				.text('Начало сна', 'start_sleep').row()
				.text('Статистика', 'stats');
						if (!state || state.stage !== 'sleeping') {
						  await ctx.answerCallbackQuery('Сначала начните сон');
								return;
						}
						const endTime = new Date();
						const sleepTime = endTime.getTime() - state.startTime.getTime();
				const hours = Math.floor(sleepTime / (1000 * 60 * 60));
						const minutes = Math.floor((sleepTime % (1000 * 60 * 60)) / (1000 * 60));
						await ctx.answerCallbackQuery(`Сон закончен. Прошло времени: ${hours} ч. ${minutes} мин.`);
						await ctx.reply(`Сон закончен. Прошло времени: ${hours} ч. ${minutes} мин.`
	, { reply_markup: buttons });
						await saveSleepRecord(chatId, state.startTime, endTime);
						userState.delete(chatId);
						break;
				case 'stats':
						await showStats(ctx);
						break;
				default:
						break;
		}
});

async function showStats(ctx) {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const records = await SleepRecord.find({ createdAt: { $gte: oneWeekAgo } });
		if (records.length === 0) {
				await ctx.reply('Записей за последнюю неделю нет.');
				return;
		}

		let statsMessage = 'Статистика за последнюю неделю:\n\n';
		records.forEach((record) => {
				statsMessage += `Ребенок: ${record.childName}\nНачало сна: ${record.sleepStart}\nКонец сна: ${record.sleepEnd}\n\n`;
		});

		await ctx.reply(statsMessage);
}

// Функция для сохранения записи о сне в MongoDB
async function saveSleepRecord(chatId, startTime, endTime) {
		const sleepRecord = new SleepRecord({
			    userId: chatId,
				sleepStart: startTime,
				sleepEnd: endTime
});
		await sleepRecord.save();
}

bot.start();
