import knex from '../knex.js';

class SleepRecord {
		static create = async (userId, startTime) => await knex('sleep_records').insert({ user_id: userId, sleep_start: startTime });

		static findByUserId = async (userId) => await knex('sleep_records').where({ user_id: userId }).orderBy('sleep_start', 'desc').first();

		static findById = async (recordId) => await knex('sleep_records').where({ id: recordId }).first();

		static findDatesByUserId = async (userId) => {
				const records = await knex('sleep_records')
						.where({ user_id: userId })
						.select(knex.raw('DATE(sleep_start) as sleep_date'))
						.groupBy('sleep_date')
						.orderBy('sleep_date', 'desc');
				return records.map(record => record.sleep_date);
		};

		static updateEndTime = async (recordId, sleepEnd) => await knex('sleep_records').where({ id: recordId }).update({ sleep_end: sleepEnd });

		static updateStartTime = async (recordId, sleepStart) => await knex('sleep_records').where({ id: recordId }).update({ sleep_start: sleepStart });
}

export default SleepRecord;
