// Simple diagnostic script to check mobile app setup
console.log('🔍 Healthcare SaaS Mobile App Diagnostic');
console.log('=====================================');

const fs = require('fs');
const path = require('path');

// Check if required files exist
const requiredFiles = [
  'index.js',
  'src/App.tsx',
  'src/navigation/SimpleNavigator.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/common/LoadingScreen.tsx',
  'src/store/authStore.ts',
  'src/services/api.ts',
  'src/types/index.ts',
  'package.json',
  'metro.config.js',
  'babel.config.js',
  'tsconfig.json'
];

console.log('\n📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json structure
console.log('\n📦 Checking package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json is valid JSON');
  console.log(`✅ Main entry: ${packageJson.main}`);
  console.log(`✅ React Native version: ${packageJson.dependencies['react-native']}`);
  console.log(`✅ Scripts available: ${Object.keys(packageJson.scripts).join(', ')}`);
} catch (error) {
  console.log('❌ package.json is invalid:', error.message);
}

// Check TypeScript config
console.log('\n🔧 Checking TypeScript config:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json is valid JSON');
  console.log(`✅ Compiler target: ${tsconfig.compilerOptions?.target}`);
} catch (error) {
  console.log('❌ tsconfig.json is invalid:', error.message);
}

console.log('\n🚀 Mobile app structure is ready!');
console.log('To run the app:');
console.log('1. Install dependencies: npm install');
console.log('2. Start Metro: npm start');
console.log('3. Run on device: npm run android (or ios)');
