/**
 * SMTP Connection Test Script
 * 
 * This script tests your SMTP configuration and helps diagnose connection issues.
 * 
 * Usage: node test-smtp-connection.js
 */

const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');

// Debug: Check if nodemailer is loaded correctly
if (typeof nodemailer.createTransport !== 'function') {
    console.error('❌ ERROR: nodemailer.createTransport is not available');
    console.error('   nodemailer object:', Object.keys(nodemailer));
    console.error('\n💡 Try reinstalling nodemailer:');
    console.error('   npm uninstall nodemailer');
    console.error('   npm install nodemailer\n');
    process.exit(1);
}

console.log('\n🔍 SMTP Connection Test Starting...\n');
console.log('=' .repeat(60));

// Display configuration (without password)
console.log('📋 Current Configuration:');
console.log('   HOST:', process.env.EMAIL_HOST || 'buddydesk.in');
console.log('   PORT:', process.env.EMAIL_PORT || '465');
console.log('   SECURE:', process.env.EMAIL_SECURE || 'true');
console.log('   USER:', process.env.EMAIL_USER || 'no-reply@buddydesk.in');
console.log('   PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('=' .repeat(60));
console.log('');

// Check if password is set
if (!process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: EMAIL_PASSWORD is not set in .env file!');
    console.log('\n💡 Add this to your .env file:');
    console.log('   EMAIL_PASSWORD=your_actual_password\n');
    process.exit(1);
}

// Configuration to test
const configs = [
    {
        name: 'Config 1: Port 465 with SSL',
        host: process.env.EMAIL_HOST || 'buddydesk.in',
        port: 465,
        secure: true,
    },
    {
        name: 'Config 2: Port 587 with STARTTLS',
        host: process.env.EMAIL_HOST || 'buddydesk.in',
        port: 587,
        secure: false,
    },
    {
        name: 'Config 3: Port 465 with mail subdomain',
        host: 'mail.' + (process.env.EMAIL_HOST || 'buddydesk.in'),
        port: 465,
        secure: true,
    }
];

// Test function
async function testConfig(config) {
    console.log(`\n📡 Testing: ${config.name}`);
    console.log('   Host:', config.host);
    console.log('   Port:', config.port);
    console.log('   Secure:', config.secure);
    
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: process.env.EMAIL_USER || 'no-reply@buddydesk.in',
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: false, // Set to true for more detailed logs
        logger: false
    });

    try {
        // Test connection
        await transporter.verify();
        console.log('   ✅ SUCCESS: SMTP connection verified!');
        console.log('   ✅ This configuration works!\n');
        
        // Ask if user wants to send a test email
        console.log('   💡 Update your .env with these settings:');
        console.log(`   EMAIL_HOST=${config.host}`);
        console.log(`   EMAIL_PORT=${config.port}`);
        console.log(`   EMAIL_SECURE=${config.secure}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ FAILED:', error.message);
        
        // Provide specific error help
        if (error.message.includes('ECONNREFUSED')) {
            console.log('   💡 Cannot connect to server. Check if:');
            console.log('      - Host name is correct');
            console.log('      - Port is not blocked by firewall');
        } else if (error.message.includes('535')) {
            console.log('   💡 Authentication failed. Check if:');
            console.log('      - Email and password are correct');
            console.log('      - SMTP is enabled for this email account');
            console.log('      - Password has special characters (try wrapping in quotes)');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('   💡 Connection timeout. Check if:');
            console.log('      - Port is open and not blocked');
            console.log('      - Server is accessible from your location');
        }
        
        return false;
    }
}

// Run all tests
async function runAllTests() {
    let successCount = 0;
    
    for (const config of configs) {
        const success = await testConfig(config);
        if (success) {
            successCount++;
            break; // Stop at first successful config
        }
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (successCount > 0) {
        console.log('✅ SMTP CONNECTION SUCCESSFUL!');
        console.log('\n📧 You can now send emails with the configuration shown above.');
        console.log('   Update your .env file and restart the application.\n');
    } else {
        console.log('❌ ALL CONFIGURATIONS FAILED');
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('   1. Verify email account exists in cPanel/webmail');
        console.log('   2. Try logging into webmail with these credentials');
        console.log('   3. Check if SMTP is enabled for the email account');
        console.log('   4. Reset the email password in cPanel');
        console.log('   5. Check firewall/security settings');
        console.log('   6. Contact your hosting provider');
        console.log('\n📚 See: docs/SMTP_AUTHENTICATION_TROUBLESHOOTING.md');
        console.log('');
    }
    
    console.log('='.repeat(60) + '\n');
}

// Run the tests
runAllTests().catch(err => {
    console.error('\n❌ Unexpected error:', err);
    process.exit(1);
});

