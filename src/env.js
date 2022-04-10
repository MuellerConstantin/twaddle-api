/**
 * @file Module that loads the environment variables from an environment file when loaded itself.
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";

/**
 * Paths in which to search for environment files.
 *
 * The order of the paths is essential, the environment files are read in this order.
 * Environment files that are already set and appear again in a later file are not set
 * again. That is, values of higher-ordered paths have higher priority and "override"
 * values of lower-ordered paths.
 */
const locations = [
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`),
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
];

locations.forEach((location) => {
  if (fs.existsSync(location)) {
    dotenv.config({ path: location });
  }
});
