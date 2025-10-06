const { Client } = require('pg');

// Test database connection
async function testDatabaseConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'healthcare_platform',
  });

  try {
    console.log('🔄 Testing database connection...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Found tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found. Run schema.sql to create tables.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if database "healthcare_platform" exists');
    console.log('3. Verify credentials in backend/.env');
    console.log('4. Try: docker-compose up -d (if using Docker)');
  } finally {
    await client.end();
  }
}

// Test backend API
async function testBackendAPI() {
  try {
    console.log('\n🔄 Testing backend API...');
    const response = await fetch('http://localhost:3001/api/docs');
    if (response.ok) {
      console.log('✅ Backend API is running!');
      console.log('📚 API Documentation: http://localhost:3001/api/docs');
    } else {
      console.log('⚠️  Backend API not responding');
    }
  } catch (error) {
    console.log('❌ Backend API not running');
    console.log('🔧 Start backend with: cd backend && npm run start:dev');
  }
}

// Run tests
async function runTests() {
  console.log('🏥 Healthcare SaaS Platform - Connection Tests\n');
  
  await testDatabaseConnection();
  await testBackendAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If database test failed: Set up PostgreSQL');
  console.log('2. If API test failed: Start backend server');
  console.log('3. If both passed: Start frontend and test login');
}

runTests().catch(console.error);
