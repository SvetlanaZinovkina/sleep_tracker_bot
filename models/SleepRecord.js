import knex from '../knex.js';

class SleepRecord {
		static create = async (userId, startTime) => await knex('sleep_records').insert({ user_id: userId, sleep_start: startTime });

		static findByUserId = async (userId) => await knex('sleep_records').where({ user_id: userId }).orderBy('sleep_start', 'desc').first();

		static updateEndTime = async (recordId, endTime) => await knex('sleep_records').where({ id: recordId }).update({ sleep_end: endTime });
}

export default SleepRecord;
