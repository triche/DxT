// JSON Schema Validation Tests (real schema validation)
console.log('=== JSON Schema Validation Tests ===\n');

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

const run = async () => {
    const { validateDiagram, validatePalette, validateTransformation } = await import('../src/utils/validation.ts');

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

    console.log('\n🧩 Schema Edge Cases:');
    test('Empty port arrays are allowed', () => {
        const diagram = {
            name: 'Empty Ports',
            nodes: [
                {
                    id: 'node1',
                    type: 'Empty',
                    x: 0,
                    y: 0,
                    properties: { name: 'Empty', inputs: [], outputs: [] }
                }
            ],
            customNodeDefs: [],
            wires: []
        };
        const errors = validateDiagram(diagram);
        assertTrue(errors.length === 0, 'Expected empty port arrays to be valid');
    });

    test('Invalid port name fails validation', () => {
        const badPalette = [
            { name: 'BadPort', inputs: [''], outputs: ['out'] }
        ];
        const errors = validatePalette(badPalette);
        assertTrue(errors.length > 0, 'Expected invalid port name error');
    });

    test('Node properties must be an object', () => {
        const diagram = {
            name: 'Bad Properties',
            nodes: [
                {
                    id: 'node1',
                    type: 'Bad',
                    x: 0,
                    y: 0,
                    properties: 'not-an-object'
                }
            ],
            customNodeDefs: [],
            wires: []
        };
        const errors = validateDiagram(diagram);
        assertTrue(errors.length > 0, 'Expected invalid properties error');
    });

    test('Missing diagram name fails validation', () => {
        const diagram = {
            nodes: [],
            customNodeDefs: [],
            wires: []
        };
        const errors = validateDiagram(diagram);
        assertTrue(errors.length > 0, 'Expected missing name error');
    });

    console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);
    if (passed !== total) {
        process.exitCode = 1;
    }
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
