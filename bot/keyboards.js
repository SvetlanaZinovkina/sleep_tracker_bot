import { InlineKeyboard } from 'grammy';
import knex from '../knex.js';
import User from '../models/User.js';
import SleepRecord from '../models/SleepRecord.js';

export const createMainButtons = (ctx) => {
		return new InlineKeyboard()
				.text(ctx.t('start-sleep-button'), 'start_sleep').row()
				.text(ctx.t('end-sleep-button'), 'end_sleep').row()
				.text(ctx.t('stats-button'), 'stats').row()
				.text(ctx.t('change-start-sleep-button'), 'change_start_time').row()
				.text(ctx.t('change-end-sleep-button'), 'change_end_time').row();
};

export const createEndSleepButton = (ctx) => {
		return new InlineKeyboard()
				.text(ctx.t('end-sleep-button'), 'end_sleep');
};

export const generateDateKeyboard = () => {
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

export const generateTimeKeyboard = () => {
		const keyboard = new InlineKeyboard();
		for (let i = 0; i < 24; i++) {
				const hourString = i < 10 ? `0${i}` : `${i}`;
				keyboard.text(`${hourString}:00`, `set_time_${hourString}:00`).row();
				keyboard.text(`${hourString}:30`, `set_time_${hourString}:30`).row();
		}
		return keyboard;
};
