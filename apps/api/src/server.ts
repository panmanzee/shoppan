/**
 * The actual process entrypoint: binds the configured `app` to a port.
 * Run via `npm run dev` (auto-restart with tsx watch) or `npm start`
 * after `npm run build`.
 */
import { app } from "./app";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
