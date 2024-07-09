import User from '../models/User.js';
import knex from '../knex.js';

const showStats = async (ctx) => {
		try {
				const oneWeekAgo = new Date();
				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

				const user = await User.findByTelegramId(ctx.chat.id);
				const records = await knex('sleep_records')
						.where({ user_id: user.id })
						.andWhere('created_at', '>=', oneWeekAgo);

				if (records.length === 0) {
						await ctx.reply('Записей за последнюю неделю нет.');
						return;
				}

				let groupedRecords = {};

				records.forEach(record => {
						const startDate = new Date(record.sleep_start).toLocaleDateString();
						if (!groupedRecords[startDate]) {
								groupedRecords[startDate] = [];
						}
						groupedRecords[startDate].push(record);
				});

				let message = 'Статистика сна:\n\n';

				for (const date in groupedRecords) {
						message += `*Дата: ${date}*\n`;
						let totalDuration = 0;

						groupedRecords[date].forEach(record => {
								const startTime = new Date(record.sleep_start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
								const endTime = new Date(record.sleep_end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
								const sleepDuration = (new Date(record.sleep_end) - new Date(record.sleep_start)) / (1000 * 60);

								totalDuration += sleepDuration;

								const hours = Math.floor(sleepDuration / 60);
								const minutes = Math.round(sleepDuration % 60);

								let durationMessage = '';

								if (hours > 0) {
										durationMessage += `${hours} ч `;
								}
								durationMessage += `${minutes} мин`;

								message += `Начало: ${startTime}\nОкончание: ${endTime}\n_Продолжительность: ${durationMessage}_\n\n`;
						});

						const totalHours = Math.floor(totalDuration / 60);
						const totalMinutes = Math.round(totalDuration % 60);

						let totalDurationMessage = '';

						if (totalHours > 0) {
								totalDurationMessage += `${totalHours} ч `;
						}
						totalDurationMessage += `${totalMinutes} мин`;

						message += `_Общая продолжительность: ${totalDurationMessage}_\n\n`;
				}

				await ctx.reply(message, { parse_mode: 'Markdown' });
		} catch (error) {
				console.error('Error in showStats function:', error);
				await ctx.reply('Произошла ошибка при получении статистики. Пожалуйста, попробуйте еще раз.');
		}
}

export default showStats;
