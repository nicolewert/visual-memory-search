# Folder Upload Integration Test

## Overview
Critical integration test for the Visual Memory Search application's folder upload functionality. This test is specifically designed for demo readiness and covers the complete user flow.

## Test Coverage

### Core User Flow
1. **Application Navigation** - Verify app loads correctly
2. **Folder Upload Mode** - Switch from single image to folder upload
3. **Folder Selection** - Select a test folder with multiple images
4. **Folder Preview** - Verify preview shows correct file count and size information
5. **Upload Processing** - Process the folder upload with visual feedback
6. **Upload Verification** - Confirm uploads are successful
7. **Search Readiness** - Verify search interface is available for uploaded content

### Demo-Focused Features
- **Visual Mode**: Runs with `headless: false` for live demonstration
- **Slow Motion**: Uses `slowMo: 800` for clear visibility during demo
- **Screenshot Capture**: Takes screenshots at each step for documentation
- **Extended Timeout**: 20-second timeouts for reliable demo performance
- **Test Data**: Uses realistic test images with descriptive names

## Quick Setup

### 1. Ensure Test Data Exists
```bash
# Create test folder with sample images
node tests/create-folder-test-images.js
```

### 2. Start Development Server
```bash
# Start the development server in background
pnpm dev-bg
```

### 3. Run Folder Upload Test
```bash
# Run the dedicated folder upload test
pnpm test-folder-upload
```

## Test Data

**Location**: `tests/test-images/sample-folder/`

**Files**:
- `login-screen.png` - Simulated login interface screenshot
- `dashboard.png` - Simulated dashboard view screenshot  
- `settings.png` - Simulated settings panel screenshot

**Size**: 3 test images (small file sizes for fast processing)

## Expected Behavior

### Success Indicators
✅ Visual Memory Search app loads correctly  
✅ Folder upload mode toggle works  
✅ Folder selection UI appears  
✅ Test folder is accepted (3 files)  
✅ Folder preview displays file count and total size  
✅ Upload processing initiates  
✅ Search interface remains available  

### Performance Expectations
- **Total Test Time**: < 30 seconds
- **Upload Processing**: < 10 seconds for 3 small images
- **UI Response**: Immediate feedback on all interactions

## Demo Usage

This test is designed to run reliably during live demonstrations:

1. **Pre-Demo**: Run once to verify everything works
2. **During Demo**: Run with audience to show functionality
3. **Post-Demo**: Screenshots are saved for reference

### Demo Script
"Let me demonstrate the folder upload functionality of our Visual Memory Search application. I'll start by switching to folder upload mode, select our test folder with multiple screenshots, and show how the system processes and indexes them for instant search."

## Troubleshooting

### Common Issues
- **Port Conflicts**: Ensure development server is running on the expected port
- **Test Data Missing**: Run `node tests/create-folder-test-images.js` to create test images
- **Timeout Issues**: Check network connection and server performance

### Debug Screenshots
All test screenshots are saved to `tests/screenshots/` with timestamps for debugging failures.

## Integration with CI

This test can be added to the main test runner by updating `tests/runner.js` to include folder upload testing alongside existing integration tests.

## Files Created

- `/tests/integration/folderUpload.test.js` - Main test file
- `/tests/create-folder-test-images.js` - Test data generator
- `/tests/test-images/sample-folder/` - Test data directory
- Updated `package.json` with `test-folder-upload` script

## Demo Readiness ✅

This test is **ready for live demonstration** with:
- Reliable performance under 30 seconds
- Visual feedback at each step
- Comprehensive coverage of folder upload workflow
- Production-ready error handling
- Clean test data that demonstrates real use cases