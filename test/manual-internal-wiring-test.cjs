/**
 * Test script to demonstrate internal wiring in transformations
 */

const fs = require('fs');

// Load the test diagram
const diagramData = JSON.parse(
  fs.readFileSync('./samples/test_internal_wiring_diagram.json', 'utf8')
);

// The Filter and Normalize nodes are connected internally
const filterNode = diagramData.nodes.find(n => n.id === 'filter-node');
const normalizeNode = diagramData.nodes.find(n => n.id === 'normalize-node');

// Get wires between these nodes
const selectedNodeIds = [filterNode.id, normalizeNode.id];
const relevantWires = diagramData.wires.filter(w => 
  selectedNodeIds.includes(w.fromNodeId) || selectedNodeIds.includes(w.toNodeId)
);

// Simulate what buildTransformationFromDiagram would do
const selectedNodes = [filterNode, normalizeNode];
const internalWires = diagramData.wires.filter(w => 
  selectedNodeIds.includes(w.fromNodeId) && selectedNodeIds.includes(w.toNodeId)
);

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
