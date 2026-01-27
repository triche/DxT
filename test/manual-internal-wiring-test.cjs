const fs = require('node:fs');
const path = require('node:path');

test('internal wiring transformation fixture is generated', () => {
  const diagramPath = path.resolve(__dirname, '../samples/test_internal_wiring_diagram.json');
  const diagramData = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));

  const filterNode = diagramData.nodes.find(n => n.id === 'filter-node');
  const normalizeNode = diagramData.nodes.find(n => n.id === 'normalize-node');

  expect(filterNode).toBeTruthy();
  expect(normalizeNode).toBeTruthy();

  const selectedNodeIds = [filterNode.id, normalizeNode.id];

  const internalWires = diagramData.wires.filter(w =>
    selectedNodeIds.includes(w.fromNodeId) && selectedNodeIds.includes(w.toNodeId)
  );

  expect(internalWires.length).toBeGreaterThan(0);

  const transformation = {
    name: 'Filter+Normalize Chain',
    inputPattern: ['in'],
    outputPattern: ['out'],
    replacementNodes: [filterNode, normalizeNode],
    internalWires,
  };

  const transformationPath = path.resolve(__dirname, '../samples/test_generated_transformation.json');
  fs.writeFileSync(transformationPath, JSON.stringify(transformation, null, 2));

  const output = JSON.parse(fs.readFileSync(transformationPath, 'utf8'));
  expect(output.internalWires.length).toBe(internalWires.length);
});
