#!/usr/bin/env node

// DxT Test Runner
console.log('🚀 DxT Test Runner\n');

const { spawn } = require('child_process');
const path = require('path');

async function runTest(testFile, testName) {
    return new Promise((resolve) => {
        console.log(`📋 Running ${testName}...`);
        const child = spawn('node', [testFile], { cwd: path.dirname(__filename) });
        
        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        child.on('close', (code) => {
            console.log(output);
            if (code === 0) {
                console.log(`✅ ${testName} completed successfully\n`);
            } else {
                console.log(`❌ ${testName} failed with exit code ${code}\n`);
            }
            resolve(code === 0);
        });
    });
}

async function runAllTests() {
    const tests = [
        { file: 'validation-test.cjs', name: 'Validation System Tests' },
        { file: 'app-functionality.test.cjs', name: 'Application Functionality Tests' }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        const passed = await runTest(test.file, test.name);
        if (!passed) allPassed = false;
    }
    
    console.log('='.repeat(60));
    if (allPassed) {
        console.log('🎉 All test suites passed! Your DxT application is working correctly.');
    } else {
        console.log('⚠️  Some test suites failed. Please review the output above.');
    }
    console.log('='.repeat(60));
    
    // Exit with non-zero code if any tests failed
    process.exit(allPassed ? 0 : 1);
}

runAllTests().catch((error) => {
    console.error(error);
    process.exit(1);
});
