#!/usr/bin/env node

/**
 * Test script to demonstrate internal wiring in transformations
 * This script:
 * 1. Loads a test diagram with Filter -> Normalize chain
 * 2. Creates a transformation from the Filter and Normalize nodes (which are internally wired)
 * 3. Verifies that internal wires are captured
 * 4. Applies the transformation to verify internal wires are recreated
 */

import { buildTransformationFromDiagram, applyTransformationToSelection } from '../src/utils/transformation.ts';
import fs from 'fs';

console.log('=== Internal Wiring Transformation Test ===\n');

// Load the test diagram
const diagramData = JSON.parse(
  fs.readFileSync('./samples/test_internal_wiring_diagram.json', 'utf8')
);

console.log('1. Loaded test diagram:');
console.log(`   - Nodes: ${diagramData.nodes.length}`);
console.log(`   - Wires: ${diagramData.wires.length}`);

// The Filter and Normalize nodes are connected internally
const filterNode = diagramData.nodes.find(n => n.id === 'filter-node');
const normalizeNode = diagramData.nodes.find(n => n.id === 'normalize-node');

console.log('\n2. Selected nodes for transformation:');
console.log(`   - Filter (${filterNode.id})`);
console.log(`   - Normalize (${normalizeNode.id})`);

// Create a transformation from just these two nodes
const selectedNodes = [filterNode, normalizeNode];
const selectedNodeIds = selectedNodes.map(n => n.id);

// Get wires between these nodes (internal) and to/from them (external)
const relevantWires = diagramData.wires.filter(w => 
  selectedNodeIds.includes(w.fromNodeId) || selectedNodeIds.includes(w.toNodeId)
);

console.log(`\n3. Wires related to selection: ${relevantWires.length}`);
relevantWires.forEach(w => {
  const isInternal = selectedNodeIds.includes(w.fromNodeId) && selectedNodeIds.includes(w.toNodeId);
  console.log(`   - ${w.id}: ${w.fromNodeId} -> ${w.toNodeId} ${isInternal ? '(INTERNAL)' : '(EXTERNAL)'}`);
});

// Build transformation
const transformation = buildTransformationFromDiagram(selectedNodes, diagramData.wires, 'Filter+Normalize Chain');

console.log('\n4. Built transformation:');
console.log(`   - Name: ${transformation.name}`);
console.log(`   - Input Pattern: [${transformation.inputPattern.join(', ')}]`);
console.log(`   - Output Pattern: [${transformation.outputPattern.join(', ')}]`);
console.log(`   - Replacement Nodes: ${transformation.replacementNodes.length}`);
console.log(`   - Internal Wires: ${transformation.internalWires?.length || 0}`);

if (transformation.internalWires && transformation.internalWires.length > 0) {
  console.log('\n   Internal Wire Details:');
  transformation.internalWires.forEach((wire, i) => {
    console.log(`   - Wire ${i+1}: ${wire.fromNodeId}[${wire.fromPortIdx}] -> ${wire.toNodeId}[${wire.toPortIdx}]`);
  });
} else {
  console.log('\n   ❌ ERROR: No internal wires captured!');
  process.exit(1);
}

// Now apply this transformation back to see if internal wires are recreated
console.log('\n5. Testing transformation application...');
const result = applyTransformationToSelection(
  diagramData.nodes,
  diagramData.wires,
  selectedNodeIds,
  transformation
);

if (!result) {
  console.log('   ❌ ERROR: Transformation failed to apply!');
  process.exit(1);
}

console.log(`   - Result nodes: ${result.nodes.length}`);
console.log(`   - Result wires: ${result.wires.length}`);

// Check for internal wires in the result
const replacementNodeIds = result.replacementNodes.map(n => n.id);
const resultInternalWires = result.wires.filter(w =>
  replacementNodeIds.includes(w.fromNodeId) && replacementNodeIds.includes(w.toNodeId)
);

console.log(`   - Internal wires in result: ${resultInternalWires.length}`);

if (resultInternalWires.length > 0) {
  console.log('\n   Internal Wire Details in Result:');
  resultInternalWires.forEach((wire, i) => {
    console.log(`   - Wire ${i+1}: ${wire.fromNodeId}[${wire.fromPortIdx}] -> ${wire.toNodeId}[${wire.toPortIdx}]`);
  });
  console.log('\n✅ SUCCESS: Internal wiring is preserved through transformation!');
} else {
  console.log('\n❌ ERROR: Internal wires were not recreated in the result!');
  process.exit(1);
}

// Save the transformation to file for manual testing
const transformationPath = './samples/test_generated_transformation.json';
fs.writeFileSync(transformationPath, JSON.stringify(transformation, null, 2));
console.log(`\n6. Saved transformation to: ${transformationPath}`);
console.log('   You can now load this transformation in the UI and verify it works correctly.');

console.log('\n=== Test Complete ===');
