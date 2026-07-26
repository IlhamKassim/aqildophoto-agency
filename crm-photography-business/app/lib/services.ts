import { createServices, type Services } from "../../src/services";

const DB_PATH = process.env.ADMIN_CONSOLE_DB_PATH ?? "./admin-console.sqlite3";

declare global {
  // eslint-disable-next-line no-var
  var __adminConsoleServices: Services | undefined;
}

export function getServices(): Services {
  if (!globalThis.__adminConsoleServices) {
    globalThis.__adminConsoleServices = createServices(DB_PATH);
  }
  return globalThis.__adminConsoleServices;
}
