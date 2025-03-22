import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '../config';

export const getSupabaseClient = () => {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
};
