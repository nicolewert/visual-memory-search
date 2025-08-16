const fs = require('fs');
const path = require('path');

// Create a simple base64 PNG for testing (1x1 white pixel)
const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Convert base64 to buffer and save as PNG
const buffer = Buffer.from(base64PNG, 'base64');
const testImagePath = path.join(__dirname, 'test-images', 'test-screenshot.png');

// Ensure directory exists
if (!fs.existsSync(path.dirname(testImagePath))) {
  fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
}

// Write the test image
fs.writeFileSync(testImagePath, buffer);
console.log('✅ Test image created:', testImagePath);