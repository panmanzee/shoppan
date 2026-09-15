/**
 * Structured (JSON) logging via pino, pretty-printed in development.
 * Use `logger.info/warn/error({...context}, "message")` instead of
 * console.log so logs are greppable/parseable once deployed.
 */
import pino from "pino";
import { env } from "@/config/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});
