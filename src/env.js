/**
 * @file Module that loads the environment variables from an environment file when loaded itself.
 */

import dotenv from "dotenv";

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: envFile });
