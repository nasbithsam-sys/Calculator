import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local directly for tests
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Row Level Security (RLS) Tests', () => {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  it('Anonymous users cannot list quotes', async () => {
    const { data, error } = await anonClient.from('quotes').select('*');
    
    // In Supabase, if RLS is enabled and there's no policy allowing select for anon,
    // it returns an empty array.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('Service role can bypass RLS to create quotes', async () => {
    const testRef = 'TEST-' + Math.random().toString(36).substring(7).toUpperCase();
    
    const { data: insertData, error: insertError } = await serviceClient
      .from('quotes')
      .insert({
        reference_number: testRef,
        status: 'incomplete',
        confidence: 'not_calculated',
        estimated_linear_feet: 100,
        estimated_price_min: 1500,
        schema_version: '1.0.0',
      })
      .select()
      .single();
      
    expect(insertError).toBeNull();
    expect(insertData).toBeDefined();
    expect(insertData.reference_number).toBe(testRef);

    // Clean up
    await serviceClient.from('quotes').delete().eq('id', insertData.id);
  });
});
