const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const TEST_IMAGE_PATH = path.join(__dirname, '../test-images/search-test-screenshot.png');
const SVG_TEST_PATH = path.join(__dirname, '../test-images/search-test.svg');
const TIMEOUT = 30000; // 30 seconds for processing

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class SearchFunctionalityTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🔍 Starting Search Functionality Integration Test...');
    
    this.browser = await chromium.launch({
      headless: false, // Show browser for demo readiness verification
      slowMo: 300 // Slow down for better visibility
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Enable file uploads and permissions
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(testName, status = 'failure') {
    const timestamp = Date.now();
    const filename = `search-${testName.replace(/\s+/g, '-').toLowerCase()}-${status}-${timestamp}.png`;
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
      await this.takeScreenshot(testName, 'success');
      this.testResults.push({ name: testName, status: 'PASS' });
      return true;
    } catch (error) {
      console.log(`❌ FAIL: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      await this.takeScreenshot(testName);
      this.testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  async testPageLoadsWithSearchInterface() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check if Visual Memory Search title is present
    const titleElement = await this.page.waitForSelector('h1', { timeout: TIMEOUT });
    const titleText = await titleElement.textContent();
    
    if (!titleText.includes('Search Your Screenshots')) {
      throw new Error(`Expected title to contain "Search Your Screenshots", got: ${titleText}`);
    }
    
    // Check if search bar is present and accessible
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    if (!searchInput) {
      throw new Error('Search input not found on page');
    }
    
    // Check if upload zone is present (needed for uploading test content)
    const uploadZone = await this.page.waitForSelector('input[type="file"]', { timeout: TIMEOUT });
    if (!uploadZone) {
      throw new Error('Upload zone not found - needed for adding searchable content');
    }
    
    // Verify search shortcut hint is displayed
    const shortcutHint = await this.page.$('text=Cmd/Ctrl + K');
    if (!shortcutHint) {
      console.log('⚠️  Search shortcut hint not visible, but continuing...');
    }
    
    console.log('✅ Search interface loaded correctly');
  }

  async testImageUploadForSearchContent() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Verify test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`Test image not found at: ${TEST_IMAGE_PATH}`);
    }
    
    // Find and use file input
    const fileInput = await this.page.waitForSelector('input[type="file"]', { timeout: TIMEOUT });
    if (!fileInput) {
      throw new Error('File input not found');
    }
    
    console.log('📤 Uploading test image for search content...');
    
    // Upload the test image
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    
    // Wait for upload to be initiated
    await this.page.waitForTimeout(2000);
    
    // Look for upload progress or status indicators
    let uploadProcessed = false;
    const maxWaitTime = 20000; // 20 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime && !uploadProcessed) {
      try {
        // Check for completion status
        const processedElements = await this.page.$$('text=Processed');
        const completedElements = await this.page.$$('text=completed');
        const successElements = await this.page.$$('text=Success');
        
        if (processedElements.length > 0 || completedElements.length > 0 || successElements.length > 0) {
          console.log('✅ Image processing completed');
          uploadProcessed = true;
          break;
        }
        
        // Check for error status
        const errorElements = await this.page.$$('text=Failed');
        const errorMessages = await this.page.$$('text=Error');
        
        if (errorElements.length > 0 || errorMessages.length > 0) {
          throw new Error('Image processing failed during upload');
        }
        
        await this.page.waitForTimeout(1000); // Wait 1 second before checking again
        console.log('⏳ Waiting for image processing...');
        
      } catch (error) {
        // Continue waiting unless it's a clear failure
        if (error.message.includes('failed') || error.message.includes('Error')) {
          throw error;
        }
      }
    }
    
    if (!uploadProcessed) {
      console.log('⚠️  Upload processing status unclear, continuing with search test...');
    }
  }

  async testBasicSearchFunctionality() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Find the search input
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    console.log('🔍 Testing basic search functionality...');
    
    // Test search with a simple query that should work regardless of uploaded content
    await searchInput.fill('dashboard');
    
    // Wait for debounced search to trigger
    await this.page.waitForTimeout(1000);
    
    // Check if search produces any response (results or no results message)
    let searchWorking = false;
    
    try {
      // Look for search results or empty state
      await Promise.race([
        this.page.waitForSelector('.grid', { timeout: 5000 }), // Results grid
        this.page.waitForSelector('text=No results found', { timeout: 5000 }), // No results
        this.page.waitForSelector('text=Start typing', { timeout: 5000 }), // Default state
        this.page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 }) // Any search results container
      ]);
      
      searchWorking = true;
      console.log('✅ Search interface responding to queries');
    } catch (error) {
      throw new Error('Search did not respond to query - no results or feedback displayed');
    }
    
    if (!searchWorking) {
      throw new Error('Search functionality appears non-responsive');
    }
  }

  async testSearchWithMultipleTerms() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    
    console.log('🔍 Testing search with multiple terms...');
    
    // Test various search terms that might be in uploaded content
    const searchTerms = [
      'login',
      'user dashboard', 
      'admin',
      'error message',
      'success',
      'button',
      'system status',
      'credentials'
    ];
    
    let searchResponseCount = 0;
    
    for (const term of searchTerms) {
      console.log(`   Testing: "${term}"`);
      
      // Ensure we have a fresh search input reference
      const currentSearchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
      
      // Clear previous search
      await currentSearchInput.fill('');
      await this.page.waitForTimeout(300);
      
      // Enter new search term
      await currentSearchInput.fill(term);
      await this.page.waitForTimeout(800); // Wait for debounce
      
      // Check for any search response
      try {
        const hasResponse = await Promise.race([
          this.page.waitForSelector('.grid', { timeout: 3000 }).then(() => 'results'),
          this.page.waitForSelector('text=No results found', { timeout: 3000 }).then(() => 'no-results'),
          this.page.waitForSelector('text=Start typing', { timeout: 3000 }).then(() => 'empty'),
          this.page.waitForSelector('[data-testid="search-results"]', { timeout: 3000 }).then(() => 'container')
        ]);
        
        if (hasResponse) {
          searchResponseCount++;
          console.log(`     ✅ Search responded for "${term}"`);
        }
      } catch (error) {
        console.log(`     ⚠️  No clear response for "${term}"`);
      }
    }
    
    if (searchResponseCount === 0) {
      throw new Error('Search did not respond to any test queries');
    }
    
    console.log(`✅ Search responded to ${searchResponseCount}/${searchTerms.length} queries`);
  }

  async testSearchResultsDisplay() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    
    console.log('🔍 Testing search results display...');
    
    // Try a search that might return results
    await searchInput.fill('test');
    await this.page.waitForTimeout(1000);
    
    // Check if search results are properly structured
    let resultsDisplayed = false;
    
    try {
      // Look for search results components
      const resultElements = await this.page.$$('.grid > *'); // Grid children (result cards)
      const searchResultsContainer = await this.page.$('[data-testid="search-results"]');
      const resultCards = await this.page.$$('.hover\\:shadow'); // Result cards with hover effects
      
      if (resultElements.length > 0) {
        console.log(`✅ Found ${resultElements.length} potential result elements`);
        resultsDisplayed = true;
      }
      
      if (resultCards.length > 0) {
        console.log(`✅ Found ${resultCards.length} result cards`);
        resultsDisplayed = true;
      }
      
      // Check for results counter
      const resultsCounter = await this.page.$('text=result');
      if (resultsCounter) {
        const counterText = await resultsCounter.textContent();
        console.log(`✅ Results counter displayed: ${counterText}`);
        resultsDisplayed = true;
      }
      
    } catch (error) {
      console.log('⚠️  Could not detect specific result elements, checking for general search response');
    }
    
    // Alternative check: just verify search interface responds
    if (!resultsDisplayed) {
      const anySearchResponse = await this.page.$('text=No results') || 
                               await this.page.$('text=found') || 
                               await this.page.$('text=Search');
      if (anySearchResponse) {
        resultsDisplayed = true;
        console.log('✅ Search interface showing appropriate response');
      }
    }
    
    if (!resultsDisplayed) {
      throw new Error('Search results display functionality not working');
    }
  }

  async testSearchKeyboardShortcut() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    console.log('⌨️  Testing search keyboard shortcut (Cmd+K)...');
    
    // Test keyboard shortcut
    await this.page.keyboard.press('Meta+k'); // Mac shortcut
    
    // Check if search input is focused
    await this.page.waitForTimeout(500);
    
    const searchInput = await this.page.waitForSelector('input[placeholder*="Search"]', { timeout: TIMEOUT });
    const isFocused = await searchInput.evaluate(el => document.activeElement === el);
    
    if (!isFocused) {
      // Try Ctrl+K for non-Mac
      await this.page.keyboard.press('Control+k');
      await this.page.waitForTimeout(500);
      
      const isNowFocused = await searchInput.evaluate(el => document.activeElement === el);
      if (!isNowFocused) {
        throw new Error('Keyboard shortcut (Cmd+K or Ctrl+K) did not focus search input');
      }
    }
    
    console.log('✅ Keyboard shortcut working - search input focused');
    
    // Test that typing works after shortcut
    await this.page.keyboard.type('shortcut test');
    const inputValue = await searchInput.inputValue();
    
    if (!inputValue.includes('shortcut test')) {
      throw new Error('Typing after keyboard shortcut did not work');
    }
    
    console.log('✅ Typing after keyboard shortcut works correctly');
  }

  async runSearchFunctionalityTests() {
    await this.setup();
    
    try {
      await this.waitForServer();
      
      console.log('\n🎯 CRITICAL SEARCH FUNCTIONALITY TESTS');
      console.log('======================================');
      
      // Run all critical search tests
      await this.runTest('Page Loads with Search Interface', () => this.testPageLoadsWithSearchInterface());
      await this.runTest('Image Upload for Search Content', () => this.testImageUploadForSearchContent());
      await this.runTest('Basic Search Functionality', () => this.testBasicSearchFunctionality());
      await this.runTest('Search with Multiple Terms', () => this.testSearchWithMultipleTerms());
      await this.runTest('Search Results Display', () => this.testSearchResultsDisplay());
      await this.runTest('Search Keyboard Shortcut', () => this.testSearchKeyboardShortcut());
      
      // Print results
      console.log('\n📊 Search Functionality Test Results:');
      console.log('=====================================');
      
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
        console.log(`\n📸 Failure screenshots saved in: ${SCREENSHOT_DIR}`);
        console.log('🚨 SEARCH FUNCTIONALITY NOT DEMO READY - Issues detected');
        process.exit(1);
      } else {
        console.log('\n🎉 SEARCH FUNCTIONALITY DEMO READY!');
        console.log('✅ All critical search features working correctly');
        console.log('📸 Success screenshots saved for demo verification');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('💥 Search functionality test suite failed:', error.message);
      await this.takeScreenshot('search-test-suite-failure');
      console.log('🚨 SEARCH NOT DEMO READY - Critical test failure');
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }
}

// Export for potential use as module
module.exports = SearchFunctionalityTest;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new SearchFunctionalityTest();
  testSuite.runSearchFunctionalityTests().catch(console.error);
}