export const up = (knex) => (
		knex.schema.createTable('users', (table) => {
				table.increments('id').primary();
				table.bigInteger('telegram_id').unique().notNullable();
				table.string('child_name').notNullable();
				table.timestamps(true, true);
		})
);

export const down = (knex) => knex.schema.dropTable('users');
