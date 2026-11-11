import { Global, Injectable, Module } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

// TypeORM uses one connection for SQLite. Serialize write transactions to avoid nested BEGINs.
@Injectable()
export class TransactionsService {
  private pending: Promise<void> = Promise.resolve();
  constructor(@InjectDataSource() private readonly database: DataSource) {}

  run<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    const result = this.pending.then(() => this.database.transaction(operation));
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }
}

@Global()
@Module({ providers: [TransactionsService], exports: [TransactionsService] })
export class TransactionsModule {}
