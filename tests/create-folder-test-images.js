const fs = require('fs');
const path = require('path');

// Create test folder structure
const testFolderPath = path.join(__dirname, 'test-images', 'sample-folder');
if (!fs.existsSync(testFolderPath)) {
  fs.mkdirSync(testFolderPath, { recursive: true });
}

// Copy existing test image and rename to create a small test folder
const sourceImagePath = path.join(__dirname, 'test-images', 'test-screenshot.png');

if (!fs.existsSync(sourceImagePath)) {
  console.error('❌ Source test image not found');
  process.exit(1);
}

// Read the source image
const imageBuffer = fs.readFileSync(sourceImagePath);

// Create 3 test images with different names for demo
const testImages = [
  'login-screen.png',
  'dashboard.png', 
  'settings.png'
];

console.log('Creating test folder for folder upload demo...');

testImages.forEach((filename) => {
  const filePath = path.join(testFolderPath, filename);
  fs.writeFileSync(filePath, imageBuffer);
  console.log(`✅ Created: ${filename}`);
});

console.log('\n🎯 Test folder ready for demo:');
console.log(`📁 Folder: ${testFolderPath}`);
console.log(`📊 Files: ${testImages.length} images created`);
console.log('📝 Content: Duplicate test images with different names for demo');
console.log('\n🚀 Ready for folder upload testing!');