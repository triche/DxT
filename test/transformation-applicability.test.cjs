// Transformation applicability tests
console.log('=== Transformation Applicability Tests ===\n');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS' });
require('ts-node/register/transpile-only');

const { getApplicableTransformations } = require('../src/utils/transformation.ts');

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

const nodes = [
    {
        id: 'source-1',
        type: 'Source',
        x: 100,
        y: 100,
        properties: { name: 'Source', inputs: [], outputs: ['out'] }
    },
    {
        id: 'filter-1',
        type: 'Filter',
        x: 300,
        y: 100,
        properties: { name: 'Filter', inputs: ['in'], outputs: ['out'] }
    },
    {
        id: 'normalize-1',
        type: 'Normalize',
        x: 500,
        y: 100,
        properties: { name: 'Normalize', inputs: ['in'], outputs: ['out'] }
    },
    {
        id: 'sink-1',
        type: 'Sink',
        x: 700,
        y: 100,
        properties: { name: 'Sink', inputs: ['in'], outputs: [] }
    },
    {
        id: 'lonely-1',
        type: 'Scale',
        x: 300,
        y: 260,
        properties: { name: 'Scale', inputs: ['in'], outputs: ['out'] }
    }
];

const wires = [
    { id: 'wire-1', fromNodeId: 'source-1', fromPortIdx: 0, toNodeId: 'filter-1', toPortIdx: 0 },
    { id: 'wire-2', fromNodeId: 'filter-1', fromPortIdx: 0, toNodeId: 'normalize-1', toPortIdx: 0 },
    { id: 'wire-3', fromNodeId: 'normalize-1', fromPortIdx: 0, toNodeId: 'sink-1', toPortIdx: 0 }
];

const transformations = [
    {
        name: 'Filter + Normalize -> OptimizedFilter',
        inputPattern: ['in'],
        outputPattern: ['out'],
        replacementNodes: []
    },
    {
        name: 'Mismatched Output',
        inputPattern: ['in'],
        outputPattern: ['result'],
        replacementNodes: []
    },
    {
        name: 'Double Input Needed',
        inputPattern: ['in', 'in'],
        outputPattern: ['out'],
        replacementNodes: []
    }
];

console.log('🔁 Applicability Matching:');

test('Transformation matches external ports of selection', () => {
    const selection = ['filter-1', 'normalize-1'];
    const applicable = getApplicableTransformations(nodes, wires, selection, transformations);
    assertTrue(applicable.some(t => t.name === 'Filter + Normalize -> OptimizedFilter'), 'Expected applicable transform');
    assertTrue(!applicable.some(t => t.name === 'Mismatched Output'), 'Did not expect mismatched output transform');
});

test('Internal wires are ignored when computing external ports', () => {
    const selection = ['filter-1', 'normalize-1'];
    const applicable = getApplicableTransformations(nodes, wires, selection, transformations);
    assertTrue(!applicable.some(t => t.name === 'Double Input Needed'), 'Internal port should not count as external');
});

test('Unconnected ports are treated as external', () => {
    const selection = ['lonely-1'];
    const applicable = getApplicableTransformations(nodes, wires, selection, transformations);
    assertTrue(applicable.some(t => t.name === 'Filter + Normalize -> OptimizedFilter'), 'Unconnected ports should still match');
});

console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);
if (passed !== total) {
    process.exitCode = 1;
}
