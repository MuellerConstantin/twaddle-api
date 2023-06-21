import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/**
 * Paths of envorinment files.
 *
 * The order of these environment files does matter. Environment variables already
 * set are not overwritten by environment variables of later files.
 */
const envPaths = [
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`),
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

envPaths.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({path: envPath});
  }
});
