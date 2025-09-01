const postgres = require('postgres');

// Test the Session Pooler connection string from .env.local
const connectionString = 'postgresql://postgres.yynbuygnrsmvvggwhhdd:sc%40nn3pr0j3ctdb2025@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';

console.log('Testing database connection with exact .env.local string...');
console.log('Connection string:', connectionString);

// Try the configuration for direct connection
const client = postgres(connectionString, {
  connect_timeout: 10,
  idle_timeout: 30,
  max: 1
});

async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Test result:', result);
    
    // Test if User table exists
    const userTableTest = await client`SELECT COUNT(*) FROM "User"`;
    console.log('✅ User table accessible!');
    console.log('User count:', userTableTest);
    
    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    console.error('Full error:', error);
  }
}

testConnection();
