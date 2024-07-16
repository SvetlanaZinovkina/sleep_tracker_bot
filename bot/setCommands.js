const setBotCommands = async (bot, i18n) => {
		const commands = [
				{ command: 'start', description: '🚀 ' + i18n.t('ru','start-bot') },
				{ command: 'start_sleep', description: '😴 ' + i18n.t('ru','start-sleep-command') },
				{ command: 'end_sleep', description: '❌ ' + i18n.t('ru', 'end-sleep-command') },
				{ command: 'stats', description: '📊 ' + i18n.t('ru', 'stats-command') },
				{ command: 'change_start_time', description: '🔄 ' + i18n.t('ru','change-start-time-command') },
				{ command: 'change_end_time', description: '🔄 ' + i18n.t('ru', 'change-end-time-command') },
				{ command: 'how_to_use', description: '💬 ' + i18n.t('ru', 'how-to-use-command') },
		];
		await bot.api.setMyCommands(commands);
};

export default setBotCommands;
