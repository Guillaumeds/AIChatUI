const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yynbuygnrsmvvggwhhdd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bmJ1eWducnNtdnZnZ3doaGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjEwNTcsImV4cCI6MjA3MjEzNzA1N30.j0-VepVAdK16s3SPBGG-iNwRdKnhwyDcqSiRE3iAv3M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateUser() {
  console.log('Testing Supabase user creation...');
  
  const email = `guest-${Date.now()}@example.com`;
  const password = 'test-password-hash';
  
  try {
    console.log('Attempting to create user with email:', email);
    
    const { data, error } = await supabase
      .from('User')
      .insert({ email, password })
      .select('id, email')
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('User data:', data);
    
  } catch (error) {
    console.error('❌ Failed to create user:', error);
  }
}

testCreateUser();
