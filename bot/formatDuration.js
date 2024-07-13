const formatDuration = (ctx, sleepDurationMinutes) => {
		const hours = Math.floor(sleepDurationMinutes / 60);
		const minutes = Math.round(sleepDurationMinutes % 60);

		let durationMessage;
		if (hours > 0) {
				durationMessage = `${ctx.t('hours', { count: hours })} ${ctx.t('minutes', { count: minutes })}`;
		} else {
				durationMessage = `${ctx.t('minutes', { count: minutes })}`;
		}
		return durationMessage;
};

export default formatDuration;
