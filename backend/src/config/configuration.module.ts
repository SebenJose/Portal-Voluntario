import { type DynamicModule, Global, Module } from "@nestjs/common";

import type { Environment } from "@/config/environment";

export const ENVIRONMENT = Symbol("ENVIRONMENT");

@Global()
@Module({})
export class ConfigurationModule {
  static register(environment: Environment): DynamicModule {
    return {
      module: ConfigurationModule,
      providers: [{ provide: ENVIRONMENT, useValue: environment }],
      exports: [ENVIRONMENT],
    };
  }
}
