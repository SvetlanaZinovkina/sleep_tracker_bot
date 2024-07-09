const formatDuration = (ctx, sleepDurationMinutes) => {
		const hours = Math.floor(sleepDurationMinutes / 60);
		const minutes = Math.round(sleepDurationMinutes % 60);

		let durationMessage;
		if (hours > 0) {
				durationMessage = `${hours} ${ctx.t('hours', { count: hours })} ${minutes} ${ctx.t('minutes', { count: minutes })}`;
		} else {
				durationMessage = `${minutes} ${ctx.t('minutes', { count: minutes })}`;
		}
};

export default formatDuration;
