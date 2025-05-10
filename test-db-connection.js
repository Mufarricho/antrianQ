// test-db-connection.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Log environment variables (without sensitive info)
  console.log('Environment variables check:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
    DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'Set (value hidden)' : 'Not set',
    DB_NAME: process.env.DB_NAME ? 'Set' : 'Not set',
    DB_SSL: process.env.DB_SSL
  });
  
  // Create connection configuration
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : undefined
  };
  
  console.log('Attempting to connect with config:', {
    host: config.host,
    database: config.database,
    ssl: config.ssl ? 'enabled' : 'disabled'
  });
  
  try {
    // Create a connection
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!');
    
    // Try a simple query
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    // Close the connection
    await connection.end();
    console.log('Connection closed');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPossible solutions:');
      console.error('1. Check if your DB_HOST is correct');
      console.error('2. Make sure your database server is running');
      console.error('3. Check if your database allows connections from your IP address');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nPossible solutions:');
      console.error('1. Check if your DB_USER and DB_PASSWORD are correct');
      console.error('2. Make sure the user has access to the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nPossible solutions:');
      console.error('1. Check if your DB_NAME is correct');
      console.error('2. Make sure the database exists');
    } else if (error.code === 'CERT_SIGNATURE_FAILURE') {
      console.error('\nPossible solutions:');
      console.error('1. Set DB_SSL=true in your .env file');
      console.error('2. Check if your database requires SSL connections');
    }
    
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Your database configuration is correct.');
    } else {
      console.log('\n❌ Database connection test failed. Please check the errors above.');
    }
  });
