import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqioqfipgdkzibtawhqy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW9xZmlwZ2RremlidGF3aHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDAyODUsImV4cCI6MjA3NjMxNjI4NX0.o7uDdCoVOZNaQ3XTgcyZm0vhHwuqAQ6lVVLg4YCc-Dw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
