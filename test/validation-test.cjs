// JSON Schema Validation Tests (real schema validation)
console.log('=== JSON Schema Validation Tests ===\n');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS' });
require('ts-node/register/transpile-only');

const { validateDiagram, validatePalette, validateTransformation } = require('../src/utils/validation.ts');

function runTest(testName, testFn) {
    try {
        const result = testFn();
        if (result === true || result === undefined) {
            console.log(`✅ ${testName}: PASSED`);
            return true;
        }
        console.log(`❌ ${testName}: FAILED - ${result}`);
        return false;
    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

let total = 0;
let passed = 0;

function test(name, fn) {
    total++;
    if (runTest(name, fn)) passed++;
}

const validDiagram = {
    name: "Test Diagram",
    nodes: [
        {
            id: "node1",
            type: "Source",
            x: 100,
            y: 100,
            properties: {
                name: "Source Node",
                inputs: [],
                outputs: ["out"]
            }
        }
    ],
    customNodeDefs: [
        {
            name: "CustomNode",
            inputs: ["in1", "in2"],
            outputs: ["out1"]
        }
    ],
    wires: [
        {
            id: "wire1",
            fromNodeId: "node1",
            fromPortIdx: 0,
            toNodeId: "node2",
            toPortIdx: 0
        }
    ]
};

const invalidDiagram = {
    name: "Test Diagram",
    nodes: [
        {
            id: "node1",
            type: "Source",
            properties: {
                name: "Source Node"
            }
        }
    ]
};

const validPalette = [
    {
        name: "CustomNode1",
        inputs: ["input1", "input2"],
        outputs: ["output1"]
    },
    {
        name: "CustomNode2",
        inputs: [],
        outputs: ["result"]
    }
];

const invalidPalette = [
    {
        name: "CustomNode1",
        inputs: ["input1"]
    },
    {
        inputs: [],
        outputs: ["result"]
    }
];

const validTransformation = {
    name: "Sample Transform",
    inputPattern: ["in"],
    outputPattern: ["out"],
    replacementNodes: [
        {
            id: "node1",
            type: "OptimizedFilter",
            x: 100,
            y: 100,
            properties: {
                name: "OptimizedFilter",
                inputs: ["in"],
                outputs: ["out"]
            }
        }
    ]
};

const invalidTransformation = {
    name: "Bad Transform",
    inputPattern: "in",
    replacementNodes: []
};

console.log('🔎 Diagram Schema Validation:');
test('Valid diagram passes validation', () => {
    const errors = validateDiagram(validDiagram);
    assertTrue(errors.length === 0, 'Expected no validation errors');
});

test('Invalid diagram fails validation', () => {
    const errors = validateDiagram(invalidDiagram);
    assertTrue(errors.length > 0, 'Expected validation errors');
});

console.log('\n🎨 Palette Schema Validation:');
test('Valid palette passes validation', () => {
    const errors = validatePalette(validPalette);
    assertTrue(errors.length === 0, 'Expected no validation errors');
});

test('Invalid palette fails validation', () => {
    const errors = validatePalette(invalidPalette);
    assertTrue(errors.length > 0, 'Expected validation errors');
});

console.log('\n🔁 Transformation Schema Validation:');
test('Valid transformation passes validation', () => {
    const errors = validateTransformation(validTransformation);
    assertTrue(errors.length === 0, 'Expected no validation errors');
});

test('Invalid transformation fails validation', () => {
    const errors = validateTransformation(invalidTransformation);
    assertTrue(errors.length > 0, 'Expected validation errors');
});

console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);

if (passed !== total) {
    process.exitCode = 1;
}
