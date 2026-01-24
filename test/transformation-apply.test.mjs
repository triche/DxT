// Transformation apply and export tests
console.log('=== Transformation Apply Tests ===\n');

import { applyTransformationToSelection, buildTransformationFromDiagram } from '../src/utils/transformation.ts';

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

function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
  }
}

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  if (runTest(name, fn)) passed++;
}

console.log('🧪 Transformation Export:');

test('Unwired ports become transformation patterns', () => {
  const nodes = [
    {
      id: 'node-a',
      type: 'A',
      x: 100,
      y: 100,
      properties: { name: 'A', inputs: ['in1', 'in2'], outputs: ['out1'] }
    },
    {
      id: 'node-b',
      type: 'B',
      x: 300,
      y: 100,
      properties: { name: 'B', inputs: ['in'], outputs: ['out'] }
    }
  ];
  const wires = [
    { id: 'wire-1', fromNodeId: 'node-a', fromPortIdx: 0, toNodeId: 'node-b', toPortIdx: 0 }
  ];
  const transformation = buildTransformationFromDiagram(nodes, wires, 'My Diagram');
  assertEqual(transformation.name, 'My Diagram');
  assertEqual([...transformation.inputPattern].sort(), ['in1', 'in2'].sort());
  assertEqual(transformation.outputPattern, ['out']);
  assertTrue(transformation.replacementNodes.length === 2, 'Expected nodes to be included');
});

console.log('\n🔁 Transformation Apply:');

test('Apply transformation rewires external connections', () => {
  const nodes = [
    { id: 'source', type: 'Source', x: 50, y: 100, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'a', type: 'A', x: 200, y: 100, properties: { name: 'A', inputs: ['in'], outputs: ['out'] } },
    { id: 'b', type: 'B', x: 350, y: 100, properties: { name: 'B', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 500, y: 100, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const wires = [
    { id: 'w1', fromNodeId: 'source', fromPortIdx: 0, toNodeId: 'a', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'a', fromPortIdx: 0, toNodeId: 'b', toPortIdx: 0 },
    { id: 'w3', fromNodeId: 'b', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 }
  ];
  const transformation = {
    name: 'Replace A+B',
    inputPattern: ['in'],
    outputPattern: ['out'],
    replacementNodes: [
      { id: 'r1', type: 'Optimized', x: 200, y: 100, properties: { name: 'Optimized', inputs: ['in'], outputs: ['out'] } }
    ]
  };

  const result = applyTransformationToSelection(nodes, wires, ['a', 'b'], transformation);
  assertTrue(result !== null, 'Expected transformation to apply');
  assertTrue(result.nodes.length === 3, 'Expected 3 nodes after replacement');
  assertTrue(result.wires.length === 2, 'Expected 2 wires after replacement');

  const wireFromSource = result.wires.find(w => w.fromNodeId === 'source');
  const wireToSink = result.wires.find(w => w.toNodeId === 'sink');
  assertTrue(!!wireFromSource, 'Expected wire from source');
  assertTrue(!!wireToSink, 'Expected wire to sink');
});

test('Apply transformation supports duplicate port names', () => {
  const nodes = [
    { id: 'src1', type: 'Source', x: 50, y: 50, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'src2', type: 'Source', x: 50, y: 120, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'p1', type: 'Proc', x: 200, y: 50, properties: { name: 'Proc', inputs: ['in'], outputs: ['out'] } },
    { id: 'p2', type: 'Proc', x: 200, y: 120, properties: { name: 'Proc', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink1', type: 'Sink', x: 400, y: 50, properties: { name: 'Sink', inputs: ['in'], outputs: [] } },
    { id: 'sink2', type: 'Sink', x: 400, y: 120, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const wires = [
    { id: 'w1', fromNodeId: 'src1', fromPortIdx: 0, toNodeId: 'p1', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'src2', fromPortIdx: 0, toNodeId: 'p2', toPortIdx: 0 },
    { id: 'w3', fromNodeId: 'p1', fromPortIdx: 0, toNodeId: 'sink1', toPortIdx: 0 },
    { id: 'w4', fromNodeId: 'p2', fromPortIdx: 0, toNodeId: 'sink2', toPortIdx: 0 }
  ];
  const transformation = {
    name: 'Merge Proc',
    inputPattern: ['in', 'in'],
    outputPattern: ['out', 'out'],
    replacementNodes: [
      { id: 'r1', type: 'Merged', x: 200, y: 80, properties: { name: 'Merged', inputs: ['in', 'in'], outputs: ['out', 'out'] } }
    ]
  };

  const result = applyTransformationToSelection(nodes, wires, ['p1', 'p2'], transformation);
  assertTrue(result !== null, 'Expected transformation to apply');
  assertTrue(result.wires.length === 4, 'Expected four external wires after replacement');
});

test('Unmatched replacement ports remain unconnected', () => {
  const nodes = [
    { id: 'src', type: 'Source', x: 50, y: 100, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'proc', type: 'Proc', x: 200, y: 100, properties: { name: 'Proc', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 350, y: 100, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const wires = [
    { id: 'w1', fromNodeId: 'src', fromPortIdx: 0, toNodeId: 'proc', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'proc', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 }
  ];
  const transformation = {
    name: 'Proc+Extra',
    inputPattern: ['in'],
    outputPattern: ['out'],
    replacementNodes: [
      { id: 'r1', type: 'ProcPlus', x: 200, y: 100, properties: { name: 'ProcPlus', inputs: ['in'], outputs: ['out', 'extra'] } }
    ]
  };

  const result = applyTransformationToSelection(nodes, wires, ['proc'], transformation);
  assertTrue(result !== null, 'Expected transformation to apply');
  assertTrue(result.wires.length === 2, 'Expected only existing external wires to be rewired');
});

console.log('\n🔗 Internal Wiring Tests:');

test('buildTransformationFromDiagram captures internal wires', () => {
  const nodes = [
    { id: 'node-a', type: 'A', x: 100, y: 100, properties: { name: 'A', inputs: ['in'], outputs: ['out'] } },
    { id: 'node-b', type: 'B', x: 300, y: 100, properties: { name: 'B', inputs: ['in'], outputs: ['out'] } }
  ];
  const wires = [
    { id: 'wire-internal', fromNodeId: 'node-a', fromPortIdx: 0, toNodeId: 'node-b', toPortIdx: 0 }
  ];
  
  const transformation = buildTransformationFromDiagram(nodes, wires, 'Internal Wire Test');
  
  assertTrue(transformation.internalWires !== undefined, 'Expected internalWires to be defined');
  assertTrue(transformation.internalWires.length === 1, 'Expected one internal wire');
  assertEqual(transformation.internalWires[0].fromNodeId, 'node-a', 'Expected wire from node-a');
  assertEqual(transformation.internalWires[0].toNodeId, 'node-b', 'Expected wire to node-b');
});

test('buildTransformationFromDiagram excludes external wires from internalWires', () => {
  const nodes = [
    { id: 'node-a', type: 'A', x: 100, y: 100, properties: { name: 'A', inputs: ['in'], outputs: ['out'] } }
  ];
  // No wires connecting node-a to other nodes in the transformation
  const wires = [];
  
  const transformation = buildTransformationFromDiagram(nodes, wires, 'No Internal Wires');
  
  // Should be undefined or empty array
  assertTrue(!transformation.internalWires || transformation.internalWires.length === 0, 'Expected no internal wires');
});

test('Apply transformation with internal wires recreates them', () => {
  const nodes = [
    { id: 'src', type: 'Source', x: 50, y: 100, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'old1', type: 'Old', x: 200, y: 100, properties: { name: 'Old', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 500, y: 100, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const wires = [
    { id: 'w1', fromNodeId: 'src', fromPortIdx: 0, toNodeId: 'old1', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'old1', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 }
  ];
  
  // Transformation with two nodes internally wired
  const transformation = {
    name: 'Replace with two nodes',
    inputPattern: ['in'],
    outputPattern: ['out'],
    replacementNodes: [
      { id: 'r1', type: 'NewA', x: 200, y: 80, properties: { name: 'NewA', inputs: ['in'], outputs: ['out'] } },
      { id: 'r2', type: 'NewB', x: 300, y: 80, properties: { name: 'NewB', inputs: ['in'], outputs: ['out'] } }
    ],
    internalWires: [
      { id: 'internal-1', fromNodeId: 'r1', fromPortIdx: 0, toNodeId: 'r2', toPortIdx: 0 }
    ]
  };

  const result = applyTransformationToSelection(nodes, wires, ['old1'], transformation);
  assertTrue(result !== null, 'Expected transformation to apply');
  
  // Should have: 1 internal wire + 2 external wires (from src and to sink)
  assertTrue(result.wires.length === 3, `Expected 3 wires total (1 internal + 2 external), got ${result.wires.length}`);
  
  // Verify the internal wire exists between the two replacement nodes
  const replacementNodeIds = result.replacementNodes.map(n => n.id);
  const internalWire = result.wires.find(w => 
    replacementNodeIds.includes(w.fromNodeId) && replacementNodeIds.includes(w.toNodeId)
  );
  assertTrue(!!internalWire, 'Expected to find an internal wire between replacement nodes');
});

test('Apply transformation with multiple internal wires', () => {
  const nodes = [
    { id: 'src', type: 'Source', x: 50, y: 100, properties: { name: 'Source', inputs: [], outputs: ['out'] } },
    { id: 'old1', type: 'Old', x: 200, y: 100, properties: { name: 'Old', inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 500, y: 100, properties: { name: 'Sink', inputs: ['in'], outputs: [] } }
  ];
  const wires = [
    { id: 'w1', fromNodeId: 'src', fromPortIdx: 0, toNodeId: 'old1', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'old1', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 }
  ];
  
  // Transformation with three nodes in a chain
  const transformation = {
    name: 'Replace with chain',
    inputPattern: ['in'],
    outputPattern: ['out'],
    replacementNodes: [
      { id: 'r1', type: 'NewA', x: 200, y: 100, properties: { name: 'NewA', inputs: ['in'], outputs: ['out'] } },
      { id: 'r2', type: 'NewB', x: 300, y: 100, properties: { name: 'NewB', inputs: ['in'], outputs: ['out'] } },
      { id: 'r3', type: 'NewC', x: 400, y: 100, properties: { name: 'NewC', inputs: ['in'], outputs: ['out'] } }
    ],
    internalWires: [
      { id: 'int-1', fromNodeId: 'r1', fromPortIdx: 0, toNodeId: 'r2', toPortIdx: 0 },
      { id: 'int-2', fromNodeId: 'r2', fromPortIdx: 0, toNodeId: 'r3', toPortIdx: 0 }
    ]
  };

  const result = applyTransformationToSelection(nodes, wires, ['old1'], transformation);
  assertTrue(result !== null, 'Expected transformation to apply');
  assertTrue(result.nodes.length === 5, 'Expected 5 nodes (src, 3 replacements, sink)');
  
  // Should have: 2 internal wires + 2 external wires
  assertTrue(result.wires.length === 4, `Expected 4 wires (2 internal + 2 external), got ${result.wires.length}`);
  
  // Verify we have two internal wires
  const replacementNodeIds = result.replacementNodes.map(n => n.id);
  const internalWires = result.wires.filter(w => 
    replacementNodeIds.includes(w.fromNodeId) && replacementNodeIds.includes(w.toNodeId)
  );
  assertTrue(internalWires.length === 2, `Expected 2 internal wires, got ${internalWires.length}`);
});

console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);
if (passed !== total) {
  process.exitCode = 1;
}
