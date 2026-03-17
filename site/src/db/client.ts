import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export function getDrizzleDb(env: SiteRuntimeEnv) {
  return drizzle(env.DB, { schema });
}
