import { createApplication } from "@/application";
import { loadEnvironment } from "@/config/environment";

async function bootstrap(): Promise<void> {
  const environment = loadEnvironment(process.env);
  const app = await createApplication(process.env);
  await app.listen(environment.API_PORT, environment.API_HOST);
}

void bootstrap().catch(() => {
  // Configuration/driver errors can contain sensitive values. Fail without printing them.
  process.stderr.write("Não foi possível iniciar a API. Verifique a configuração, o driver SQLite e a porta.\n");
  process.exitCode = 1;
});
