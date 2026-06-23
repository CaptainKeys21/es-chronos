import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("username").notNullable();
    table.string("email").notNullable();
    table.string("pwd_hash").notNullable();
  });
  await knex.schema.createTable("agenda", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable().unique();
    table.string("timezone").notNullable();
    table.string("visibility").notNullable();
    table.uuid("owner_id").references("id").inTable("user").onDelete("CASCADE");
  });
  await knex.schema.createTable("participant", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("permissions").notNullable();
    table.uuid("user_id").references("id").inTable("user").onDelete("CASCADE");
    table
      .uuid("agenda_id")
      .references("id")
      .inTable("agenda")
      .onDelete("CASCADE");
  });
  await knex.schema.createTable("task", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.integer("progress").notNullable();
    table.datetime("deadline").notNullable();
    table.uuid("owner_id").references("id").inTable("user").onDelete("CASCADE");
    table
      .uuid("agenda_id")
      .references("id")
      .inTable("agenda")
      .onDelete("CASCADE");

    table.unique(["name", "agenda_id"]);
  });
  await knex.schema.createTable("event", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("weekdays").notNullable();
    table.string("status").notNullable();
    table.datetime("date").notNullable();
    table
      .uuid("agenda_id")
      .references("id")
      .inTable("agenda")
      .onDelete("CASCADE");
    table.unique(["name", "agenda_id"]);
  });
  await knex.schema.createTable("role", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table
      .uuid("agenda_id")
      .references("id")
      .inTable("agenda")
      .onDelete("CASCADE");
    table.unique(["name", "agenda_id"]);
  });
  await knex.schema.createTable("participant_event", (table) => {
    table
      .uuid("p_id")
      .references("id")
      .inTable("participant")
      .onDelete("CASCADE");
    table.uuid("e_id").references("id").inTable("event").onDelete("CASCADE");
  });
  await knex.schema.createTable("participant_role", (table) => {
    table
      .uuid("p_id")
      .references("id")
      .inTable("participant")
      .onDelete("CASCADE");
    table.uuid("r_id").references("id").inTable("role").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("agenda");
  await knex.schema.dropTableIfExists("participant");
  await knex.schema.dropTableIfExists("task");
  await knex.schema.dropTableIfExists("event");
  await knex.schema.dropTableIfExists("role");
  await knex.schema.dropTableIfExists("participant_event");
  await knex.schema.dropTableIfExists("participant_role");
}
