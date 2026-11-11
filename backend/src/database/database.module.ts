import { Module } from "@nestjs/common";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";

import { ENVIRONMENT } from "@/config/configuration.module";
import type { Environment } from "@/config/environment";
import { databaseOptions } from "@/database/options";
import { TransactionsModule } from "@/database/transactions.service";

@Module({
  imports: [TypeOrmModule.forRootAsync({
    inject: [ENVIRONMENT],
    useFactory: (environment: Environment): TypeOrmModuleOptions => {
      return {
        ...databaseOptions(environment),
        // Fail promptly on configuration/native driver failures; do not hide startup errors.
        retryAttempts: 1,
      };
    },
  }), TransactionsModule],
})
export class DatabaseModule {}
