import { createClient } from "redis";
import env from "./env";
import logger from "./logger";

const client = createClient({ url: env.cache.uri });

client.on("error", (err) =>
  logger.error("Cache connection error occurred", err)
);

client.on("ready", () =>
  logger.notice(`Cache connection established to '${env.cache.uri}'`)
);

client.on("end", () => logger.notice("Cache connection closed"));

export default client;
