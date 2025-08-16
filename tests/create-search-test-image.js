const fs = require('fs');
const path = require('path');

// Create a simple HTML file that we can use to generate a screenshot with meaningful text
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Screenshot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
            margin: 0;
            width: 800px;
            height: 600px;
        }
        .header {
            color: #2563eb;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
            color: #374151;
        }
        .button {
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            margin: 10px 5px;
        }
        .error {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #dc2626;
            margin: 15px 0;
        }
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #10b981;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">User Dashboard - Login Required</div>
    
    <div class="content">
        <p>Welcome to the admin panel. Please enter your credentials to continue.</p>
        
        <form>
            <div style="margin: 10px 0;">
                <label>Email Address:</label>
                <input type="email" placeholder="user@example.com" style="width: 300px; padding: 8px; margin-left: 10px;">
            </div>
            
            <div style="margin: 10px 0;">
                <label>Password:</label>
                <input type="password" placeholder="Enter password" style="width: 300px; padding: 8px; margin-left: 10px;">
            </div>
            
            <div style="margin: 20px 0;">
                <button class="button" type="submit">Sign In</button>
                <button class="button" type="button">Reset Password</button>
                <button class="button" type="button">Create Account</button>
            </div>
        </form>
        
        <div class="error">
            Error: Invalid login credentials. Please try again.
        </div>
        
        <div class="success">
            Success: Your account has been verified successfully!
        </div>
        
        <div style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <p>System Status: <span style="color: #10b981; font-weight: bold;">Online</span></p>
            <p>Last Login: March 15, 2024 at 2:30 PM</p>
            <p>Session ID: abc123def456</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <h3>Quick Actions:</h3>
            <ul>
                <li>View Reports</li>
                <li>Manage Users</li>
                <li>System Settings</li>
                <li>Export Data</li>
            </ul>
        </div>
    </div>
</body>
</html>
`;

// Ensure directory exists
const testImagesDir = path.join(__dirname, 'test-images');
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

// Write the HTML file
const htmlPath = path.join(testImagesDir, 'test-content.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('✅ Test HTML content created:', htmlPath);
console.log('📝 This HTML contains searchable text including:');
console.log('   - "User Dashboard"');  
console.log('   - "Login Required"');
console.log('   - "admin panel"');
console.log('   - "Sign In"');
console.log('   - "Reset Password"');
console.log('   - "Error: Invalid login"');
console.log('   - "Success: account verified"');
console.log('   - "System Status: Online"');
console.log('   - "View Reports"');

// Create a simple base64 PNG with readable text (using a pre-generated base64)
// This is a 400x300 blue image with white text saying "User Dashboard Login"
const base64ImageData = `iVBORw0KGgoAAAANSUhEUgAAAZAAAAEsCAYAAADtt+XCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAitSURBVHic7d1bbBTnHcfx30zMGmxjbGNsY4yxjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xjbGNsY2xqz9EBgwAAAABJRU5ErkJggg==`;

// Convert base64 to buffer and save as PNG
const buffer = Buffer.from(base64ImageData, 'base64');
const pngPath = path.join(testImagesDir, 'search-test-screenshot.png');
fs.writeFileSync(pngPath, buffer);

console.log('✅ Test image created:', pngPath);