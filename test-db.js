import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing insert...");
    const { data, error } = await supabase
        .from('exchange_rates')
        .upsert({
            currency: 'USD',
            rate: 45.12,
            effective_date: new Date().toISOString().split('T')[0]
        }, { onConflict: 'currency,effective_date' });

    console.log("Error:", error);
    console.log("Data:", data);
}

test();
