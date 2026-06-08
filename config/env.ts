import * as dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL || 'https://crossadv.atex.com/ci/3/crossad/web',
  username: process.env.APP_USERNAME || 'op',
  password: required('APP_PASSWORD'),
  db: {
    host: process.env.DB_HOST || '',
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
  },
};
