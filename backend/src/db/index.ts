import knex from "knex";
import config from "./knexfile.ts";

const enviroment = process.env.NODE_ENV || "development";
const connectionConfig = config[enviroment]!;

const db = knex(connectionConfig);

export default db;
