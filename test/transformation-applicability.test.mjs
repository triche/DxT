// Transformation applicability tests
console.log('=== Transformation Applicability Tests ===\n');

import { getApplicableTransformations } from '../src/utils/transformation.ts';

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

test('Duplicate port names are matched as a multiset', () => {
  const localNodes = [
    { id: 'src-a', type: 'Source', x: 50, y: 50, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'src-b', type: 'Source', x: 50, y: 120, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'proc-a', type: 'Proc', x: 220, y: 50, properties: { name: 'Proc', inputs: ['in'], outputs: ['out'] } },
    { id: 'proc-b', type: 'Proc', x: 220, y: 120, properties: { name: 'Proc', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 420, y: 85, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const localWires = [
    { id: 'w1', fromNodeId: 'src-a', fromPortIdx: 0, toNodeId: 'proc-a', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'src-b', fromPortIdx: 0, toNodeId: 'proc-b', toPortIdx: 0 },
    { id: 'w3', fromNodeId: 'proc-a', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 },
    { id: 'w4', fromNodeId: 'proc-b', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 }
  ];
  const localTransforms = [
    { name: 'Two In, One Out', inputPattern: ['in', 'in'], outputPattern: ['out', 'out'], replacementNodes: [] }
  ];
  const selection = ['proc-a', 'proc-b'];
  const applicable = getApplicableTransformations(localNodes, localWires, selection, localTransforms);
  assertTrue(applicable.length === 1, 'Expected multiset match for duplicate ports');
});

console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);
if (passed !== total) {
  process.exitCode = 1;
}
