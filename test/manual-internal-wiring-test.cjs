/**
 * Test script to demonstrate internal wiring in transformations
 */

const fs = require('fs');

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

// Get wires between these nodes
const selectedNodeIds = [filterNode.id, normalizeNode.id];
const relevantWires = diagramData.wires.filter(w => 
  selectedNodeIds.includes(w.fromNodeId) || selectedNodeIds.includes(w.toNodeId)
);

console.log(`\n3. Wires related to selection: ${relevantWires.length}`);
relevantWires.forEach(w => {
  const isInternal = selectedNodeIds.includes(w.fromNodeId) && selectedNodeIds.includes(w.toNodeId);
  console.log(`   - ${w.id}: ${w.fromNodeId} -> ${w.toNodeId} ${isInternal ? '(INTERNAL)' : '(EXTERNAL)'}`);
});

// Simulate what buildTransformationFromDiagram would do
const selectedNodes = [filterNode, normalizeNode];
const internalWires = diagramData.wires.filter(w => 
  selectedNodeIds.includes(w.fromNodeId) && selectedNodeIds.includes(w.toNodeId)
);

console.log('\n4. Internal wires that should be captured:');
console.log(`   - Count: ${internalWires.length}`);
if (internalWires.length > 0) {
  internalWires.forEach((wire, i) => {
    console.log(`   - Wire ${i+1}: ${wire.fromNodeId}[${wire.fromPortIdx}] -> ${wire.toNodeId}[${wire.toPortIdx}]`);
  });
  console.log('\n✅ Internal wires are present in the diagram');
} else {
  console.log('\n❌ No internal wires found');
}

// Create a sample transformation manually
const transformation = {
  name: 'Filter+Normalize Chain',
  inputPattern: ['in'],
  outputPattern: ['out'],
  replacementNodes: selectedNodes,
  internalWires: internalWires
};

// Save to file
const transformationPath = './samples/test_generated_transformation.json';
fs.writeFileSync(transformationPath, JSON.stringify(transformation, null, 2));
console.log(`\n5. Saved transformation to: ${transformationPath}`);

console.log('\n✅ Test Complete - You can now:');
console.log('   1. Start the app with: npm run dev');
console.log('   2. Load the test diagram: samples/test_internal_wiring_diagram.json');
console.log('   3. Select the Filter and Normalize nodes');
console.log('   4. Save as transformation to verify internal wiring is captured');
console.log('   5. Delete the selected nodes');
console.log('   6. Load the generated transformation: samples/test_generated_transformation.json');
console.log('   7. Apply the transformation to verify internal wiring is recreated');
