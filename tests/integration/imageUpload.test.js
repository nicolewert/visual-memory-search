const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const TEST_IMAGE_PATH = path.join(__dirname, '../test-images/test-screenshot.png');
const TIMEOUT = 30000; // Longer timeout for image processing

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class ImageUploadIntegrationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Starting Image Upload Integration Test...');
    
    this.browser = await chromium.launch({
      headless: false, // Show browser for demo readiness verification
      slowMo: 500 // Slow down for better visibility
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Enable file uploads
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(testName, status = 'failure') {
    const timestamp = Date.now();
    const filename = `${testName}-${status}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async waitForServer() {
    console.log('⏳ Waiting for development server...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await this.page.goto(BASE_URL, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.status() === 200) {
          console.log('✅ Development server is ready');
          return true;
        }
      } catch (error) {
        console.log(`⏳ Server not ready, attempt ${i + 1}/30...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('❌ Development server failed to start within 30 seconds');
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFunction();
      console.log(`✅ PASS: ${testName}`);
      await this.takeScreenshot(testName.replace(/\s+/g, '-').toLowerCase(), 'success');
      this.testResults.push({ name: testName, status: 'PASS' });
      return true;
    } catch (error) {
      console.log(`❌ FAIL: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      await this.takeScreenshot(testName.replace(/\s+/g, '-').toLowerCase());
      this.testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  async testPageLoadsWithUploadZone() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check if Visual Memory Search title is present
    const titleElement = await this.page.waitForSelector('h1', { timeout: TIMEOUT });
    const titleText = await titleElement.textContent();
    
    if (!titleText.includes('Search Your Screenshots')) {
      throw new Error(`Expected title to contain "Search Your Screenshots", got: ${titleText}`);
    }
    
    // Check if upload zone is present
    const uploadZone = await this.page.waitForSelector('[data-testid="upload-zone"], .cursor-pointer', { timeout: TIMEOUT });
    if (!uploadZone) {
      throw new Error('Upload zone not found on page');
    }
    
    // Verify upload zone text
    const uploadText = await this.page.textContent('.cursor-pointer');
    if (!uploadText || !uploadText.includes('Drag & Drop')) {
      throw new Error('Upload zone does not contain expected text');
    }
  }

  async testImageUploadFlow() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Verify test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`Test image not found at: ${TEST_IMAGE_PATH}`);
    }
    
    // Find file input within the upload zone
    const fileInput = await this.page.waitForSelector('input[type="file"]', { timeout: TIMEOUT });
    if (!fileInput) {
      throw new Error('File input not found');
    }
    
    console.log('📤 Uploading test image...');
    
    // Upload the test image
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    
    // Wait for upload status to appear
    console.log('⏳ Waiting for upload status...');
    await this.page.waitForSelector('.mb-2.p-2.rounded-lg', { timeout: TIMEOUT });
    
    // Look for upload progress or completion
    const uploadStatus = await this.page.waitForSelector('text=test-screenshot.png', { timeout: TIMEOUT });
    if (!uploadStatus) {
      throw new Error('Upload status not displayed for uploaded file');
    }
    
    console.log('⏳ Waiting for processing to complete...');
    
    // Wait for either success or error status
    try {
      // Wait for success indicator
      await this.page.waitForSelector('text=Processed', { timeout: TIMEOUT });
      console.log('✅ File processed successfully');
    } catch (error) {
      // Check for error status
      const errorElement = await this.page.$('text=Failed');
      if (errorElement) {
        const errorText = await this.page.textContent('.text-red-600');
        throw new Error(`Upload failed: ${errorText}`);
      }
      throw new Error('Upload processing did not complete within timeout');
    }
  }

  async testUploadedImageInStats() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for stats section to load and give time for Convex sync
    await this.page.waitForSelector('text=Total Screenshots', { timeout: TIMEOUT });
    
    // Wait for potential data sync and retry checking stats
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Check if stats show at least one screenshot
      const statsText = await this.page.textContent('body');
      
      // Look for non-zero screenshot count
      const screenshotCount = statsText.match(/(\d+)\s*Total Screenshots/);
      if (screenshotCount && parseInt(screenshotCount[1]) > 0) {
        console.log(`📊 Stats show ${screenshotCount[1]} screenshot(s)`);
        return; // Success!
      }
      
      attempts++;
      console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Waiting for stats to update...`);
      await this.page.waitForTimeout(2000); // Wait 2 seconds before retry
      
      // Refresh the page to get updated data
      if (attempts === 5) {
        await this.page.reload({ waitUntil: 'networkidle' });
      }
    }
    
    throw new Error('Stats do not show any uploaded screenshots after multiple attempts');
  }

  async testSearchFunctionality() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Find search input
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    console.log('🔍 Testing search functionality...');
    
    // Perform a search for common terms that might be in uploaded images
    await searchInput.fill('test');
    
    // Wait for search to process (debounced)
    await this.page.waitForTimeout(1000);
    
    // Check if search results appear or no results message appears
    try {
      // Look for either results or "no results" message
      await Promise.race([
        this.page.waitForSelector('.grid', { timeout: 5000 }), // Results grid
        this.page.waitForSelector('text=No results found', { timeout: 5000 }) // No results message
      ]);
      
      console.log('✅ Search functionality is working');
    } catch (error) {
      throw new Error('Search did not return any response (results or no results message)');
    }
  }

  async runCriticalUploadTest() {
    await this.setup();
    
    try {
      await this.waitForServer();
      
      // Run the critical upload flow tests
      await this.runTest('Page Loads with Upload Zone', () => this.testPageLoadsWithUploadZone());
      await this.runTest('Image Upload Flow', () => this.testImageUploadFlow());
      await this.runTest('Uploaded Image in Stats', () => this.testUploadedImageInStats());
      await this.runTest('Search Functionality', () => this.testSearchFunctionality());
      
      // Print results
      console.log('\n📊 Critical Upload Test Results:');
      console.log('================================');
      
      const passed = this.testResults.filter(r => r.status === 'PASS').length;
      const failed = this.testResults.filter(r => r.status === 'FAIL').length;
      
      this.testResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        if (result.error) {
          console.log(`   ${result.error}`);
        }
      });
      
      console.log(`\nTotal: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
      
      if (failed > 0) {
        console.log(`\n📸 Screenshots saved in: ${SCREENSHOT_DIR}`);
        console.log('🚨 DEMO NOT READY - Upload flow has issues');
        process.exit(1);
      } else {
        console.log('\n🎉 DEMO READY - All critical upload tests passed!');
        console.log('📸 Success screenshots saved for demo verification');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('💥 Critical test suite failed:', error.message);
      await this.takeScreenshot('critical-test-failure');
      console.log('🚨 DEMO NOT READY - Critical error in upload flow');
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }
}

// Export for potential use as module
module.exports = ImageUploadIntegrationTest;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new ImageUploadIntegrationTest();
  testSuite.runCriticalUploadTest().catch(console.error);
}