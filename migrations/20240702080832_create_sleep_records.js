export const up = (knex) => (
		knex.schema.createTable('sleep_records', (table) => {
				table.increments('id').primary();
				table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
				table.timestamp('sleep_start').notNullable();
				table.timestamp('sleep_end');
				table.timestamps(true, true);
		})
);

export const down = (knex) => knex.schema.dropTable('sleep_records');
