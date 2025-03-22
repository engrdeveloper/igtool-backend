// import things from env
import { config } from 'dotenv';
config();

export const PORT = process.env.PORT || 3000;
export const WEBHOOK_VERIFICATION = process.env.WEBHOOK_VERIFICATION;
export const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
export const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
export const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY;