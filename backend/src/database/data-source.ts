import "reflect-metadata";
import { DataSource } from "typeorm";
import { environmentSchema } from "@/config/environment";
import { databaseOptions } from "@/database/options";

const dataSource = new DataSource(databaseOptions(environmentSchema.pick({ DATABASE_PATH: true }).parse(process.env)));
export default dataSource;
