const mysql = require('mysql2/promise');

// Test MySQL database connection for Hostinger
async function testMySQLConnection() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_platform',
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 30000,
    timeout: 30000,
  };

  let connection;
  
  try {
    console.log('🔄 Testing MySQL database connection...');
    console.log(`Host: ${connectionConfig.host}:${connectionConfig.port}`);
    console.log(`Database: ${connectionConfig.database}`);
    console.log(`User: ${connectionConfig.user}`);
    
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ MySQL database connection successful!');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('📊 MySQL version:', rows[0].version);
    
    // Test if tables exist
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [connectionConfig.database]);
    
    if (tables.length > 0) {
      console.log('📋 Found tables:', tables.map(row => row.table_name).join(', '));
      
      // Test key tables
      const keyTables = ['tenants', 'users', 'patients', 'appointments'];
      for (const tableName of keyTables) {
        try {
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`📊 ${tableName}: ${count[0].count} records`);
        } catch (error) {
          console.log(`⚠️  Table ${tableName}: ${error.message}`);
        }
      }
    } else {
      console.log('⚠️  No tables found. Import mysql-schema.sql to create tables.');
    }
    
    // Test character set
    const [charset] = await connection.execute('SELECT @@character_set_database as charset');
    console.log('🔤 Database character set:', charset[0].charset);
    
    // Test timezone
    const [timezone] = await connection.execute('SELECT @@time_zone as timezone');
    console.log('🕐 Database timezone:', timezone[0].timezone);
    
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check if database exists');
    console.log('3. Verify credentials in .env file');
    console.log('4. For Hostinger: Check database settings in control panel');
    console.log('5. Try: docker-compose -f docker-compose.mysql.yml up -d (for local testing)');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔐 Authentication Error:');
      console.log('- Check username and password');
      console.log('- Verify user has access to the database');
      console.log('- For Hostinger: Check database user permissions');
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n📁 Database Not Found:');
      console.log('- Create the database first');
      console.log('- Check database name spelling');
      console.log('- For Hostinger: Create database in control panel');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🌐 Connection Refused:');
      console.log('- Check if MySQL server is running');
      console.log('- Verify host and port settings');
      console.log('- Check firewall settings');
    }
    
  } finally {
    if (connection) {
      await connection.end();
    }
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

// Test MySQL-specific features
async function testMySQLFeatures() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_platform',
  };

  let connection;
  
  try {
    console.log('\n🔄 Testing MySQL-specific features...');
    connection = await mysql.createConnection(connectionConfig);
    
    // Test JSON functions
    const [jsonTest] = await connection.execute(`
      SELECT JSON_OBJECT('test', 'value') as json_test
    `);
    console.log('✅ JSON functions working:', jsonTest[0].json_test);
    
    // Test UUID functions (MySQL 8.0+)
    try {
      const [uuidTest] = await connection.execute(`
        SELECT UUID() as uuid_test
      `);
      console.log('✅ UUID functions working:', uuidTest[0].uuid_test);
    } catch (error) {
      console.log('⚠️  UUID functions not available (MySQL < 8.0)');
    }
    
    // Test storage engines
    const [engines] = await connection.execute(`
      SELECT ENGINE, SUPPORT 
      FROM information_schema.ENGINES 
      WHERE ENGINE IN ('InnoDB', 'MyISAM')
    `);
    console.log('✅ Available storage engines:', engines.map(e => `${e.ENGINE}: ${e.SUPPORT}`).join(', '));
    
  } catch (error) {
    console.log('❌ MySQL feature test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run all tests
async function runTests() {
  console.log('🏥 Healthcare SaaS Platform - MySQL Connection Tests\n');
  
  await testMySQLConnection();
  await testMySQLFeatures();
  await testBackendAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If database test failed: Set up MySQL database');
  console.log('2. If API test failed: Start backend server');
  console.log('3. If both passed: Test application features');
  console.log('4. For Hostinger: Follow HOSTINGER_SETUP_GUIDE.md');
}

runTests().catch(console.error);
