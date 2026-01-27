#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function runTest(testFile, testName, useTsx = false) {
    return new Promise((resolve) => {
        const command = useTsx ? 'npx' : 'node';
        const args = useTsx ? ['tsx', testFile] : [testFile];
        const child = spawn(command, args, { cwd: path.dirname(__filename), env: process.env, stdio: 'ignore' });

        child.on('close', (code) => resolve(code === 0));
    });
}

async function runAllTests() {
    const tests = [
        { file: 'validation-test.cjs', name: 'Validation System Tests', useTsx: true },
        { file: 'app-functionality.test.cjs', name: 'Application Functionality Tests', useTsx: false },
        { file: 'transformation-applicability.test.cjs', name: 'Transformation Applicability Tests', useTsx: true },
        { file: 'transformation-apply.test.cjs', name: 'Transformation Apply Tests', useTsx: true }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        const passed = await runTest(test.file, test.name, test.useTsx);
        if (!passed) allPassed = false;
    }
    
    return allPassed;
}

runAllTests()
    .then((allPassed) => {
        process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
