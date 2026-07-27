/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@govee.local';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error("ADMIN_PASSWORD environment variable is required.");
    process.exit(1);
  }

  console.log('Creating admin user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating auth user:', authError);
      return;
    }
  } else {
    console.log('Auth user created successfully:', authData.user.id);
    
    const { error: profileError } = await supabase.from('admin_profiles').insert({
      id: authData.user.id,
      email: email,
    });

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
    } else {
      console.log('Admin profile created successfully.');
    }
  }
}

createAdmin();
