
import { createClient } from '@supabase/supabase-js';

// These would normally be in .env, but for this environment we assume they are injected or provided
const supabaseUrl = process.env.SUPABASE_URL || 'https://uuzxflbsronbrnoxqtol.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_zUhSO6k24vNFnU83pWecaw_JyFu3Tvh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
