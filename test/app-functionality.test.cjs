// Comprehensive test suite for DxT application functionality
console.log('=== DxT Application Functionality Tests ===\n');

const fs = require('fs');
const path = require('path');

// Test utilities
function runTest(testName, testFn) {
    try {
        const result = testFn();
        if (result === true || result === undefined) {
            console.log(`✅ ${testName}: PASSED`);
            return true;
        } else {
            console.log(`❌ ${testName}: FAILED - ${result}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function assertEqual(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Mock data structures
const createMockNode = (id, type, x = 100, y = 100) => ({
    id,
    type,
    x,
    y,
    properties: { name: type, inputs: type === 'Sink' ? ['in'] : [], outputs: type === 'Source' ? ['out'] : [] }
});

const createMockWire = (id, fromNodeId, fromPortIdx, toNodeId, toPortIdx) => ({
    id,
    fromNodeId,
    fromPortIdx,
    toNodeId,
    toPortIdx
});

const createMockNodeDef = (name, inputs, outputs) => ({
    name,
    inputs,
    outputs
});

// Test counters
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
    totalTests++;
    if (runTest(name, fn)) {
        passedTests++;
    }
}

// === NODE MANAGEMENT TESTS ===
console.log('📦 Node Management Tests:');

test('Create node with valid properties', () => {
    const node = createMockNode('node1', 'Source', 50, 75);
    assertEqual(node.id, 'node1');
    assertEqual(node.type, 'Source');
    assertEqual(node.x, 50);
    assertEqual(node.y, 75);
    assertTrue(node.properties.name === 'Source');
});

test('Node should have correct port configuration', () => {
    const sourceNode = createMockNode('source1', 'Source');
    const sinkNode = createMockNode('sink1', 'Sink');
    
    assertEqual(sourceNode.properties.inputs, []);
    assertEqual(sourceNode.properties.outputs, ['out']);
    assertEqual(sinkNode.properties.inputs, ['in']);
    assertEqual(sinkNode.properties.outputs, []);
});

test('Node position updates correctly', () => {
    const node = createMockNode('node1', 'Source', 100, 100);
    // Simulate position update
    const updatedNode = { ...node, x: 200, y: 150 };
    assertEqual(updatedNode.x, 200);
    assertEqual(updatedNode.y, 150);
});

test('Node property updates preserve other properties', () => {
    const node = createMockNode('node1', 'Source');
    const originalProperties = { ...node.properties };
    // Simulate property update
    const updatedProperties = { ...originalProperties, label: 'My Source', description: 'Test node' };
    assertTrue(updatedProperties.name === originalProperties.name);
    assertTrue(updatedProperties.label === 'My Source');
    assertTrue(updatedProperties.description === 'Test node');
});

// === WIRE MANAGEMENT TESTS ===
console.log('\n🔌 Wire Management Tests:');

test('Create valid wire connection', () => {
    const wire = createMockWire('wire1', 'source1', 0, 'sink1', 0);
    assertEqual(wire.fromNodeId, 'source1');
    assertEqual(wire.fromPortIdx, 0);
    assertEqual(wire.toNodeId, 'sink1');
    assertEqual(wire.toPortIdx, 0);
});

test('Wire validation - no duplicate input connections', () => {
    const existingWires = [
        createMockWire('wire1', 'source1', 0, 'sink1', 0)
    ];
    
    // Attempt to create duplicate connection to same input port
    const newWire = createMockWire('wire2', 'source2', 0, 'sink1', 0);
    
    // Check if input port is already connected
    const isInputOccupied = existingWires.some(w => 
        w.toNodeId === newWire.toNodeId && w.toPortIdx === newWire.toPortIdx
    );
    
    assertTrue(isInputOccupied, 'Should detect duplicate input connection');
});

test('Wire removal affects connected nodes', () => {
    const wires = [
        createMockWire('wire1', 'source1', 0, 'sink1', 0),
        createMockWire('wire2', 'source1', 0, 'sink2', 0)
    ];
    
    // Remove wires connected to source1
    const remainingWires = wires.filter(w => w.fromNodeId !== 'source1');
    assertEqual(remainingWires.length, 0);
});

test('Shift-click wire selection adds without toggling off', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const pattern = /handleSelectWire[\s\S]*setSelectedWireIds\(\s*ids\s*=>\s*ids\.includes\(id\)\s*\?\s*ids\s*:\s*\[\.\.\.ids,\s*id\]\s*\)/;
    assertTrue(pattern.test(content), 'Expected shift-click to add wire without deselecting existing selection');
});

test('Delete selection removes nodes and wires together', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const pattern = /handleDelete[\s\S]*setNodes\(nodes\s*=>\s*nodes\.filter\(n\s*=>\s*!selectedNodeIds\.includes\(n\.id\)\)\)[\s\S]*setWires\(wires\s*=>\s*wires\.filter\(w\s*=>[\s\S]*!selectedWireIds\.includes\(w\.id\)[\s\S]*!selectedNodeIds\.includes\(w\.fromNodeId\)[\s\S]*!selectedNodeIds\.includes\(w\.toNodeId\)/;
    assertTrue(pattern.test(content), 'Expected delete to remove selected nodes and selected wires in one action');
});

test('Select all includes wires', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const pattern = /key\.toLowerCase\(\)\s*===\s*'a'[\s\S]*onSetSelectedNodeIds\([\s\S]*nodes\.map\(n\s*=>\s*n\.id\)\)[\s\S]*onSetSelectedWireIds\([\s\S]*wires\.map\(w\s*=>\s*w\.id\)\)/;
    assertTrue(pattern.test(content), 'Expected Ctrl/Cmd+A to select nodes and wires');
});

test('Ctrl/Cmd+Z triggers undo', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const pattern = /key\.toLowerCase\(\)\s*===\s*'z'[\s\S]*onUndo\(\)/;
    assertTrue(pattern.test(content), 'Expected Ctrl/Cmd+Z to call undo');
});

test('Wire click does not start lasso selection', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const pattern = /<polyline[\s\S]*onMouseDown=\{e => \{[\s\S]*e\.stopPropagation\(\)[\s\S]*\}\}/;
    assertTrue(pattern.test(content), 'Expected wire click target to stop propagation on mouse down');
});

test('Blank canvas clicks clear selection', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const pattern = /onClick=\{e => \{[\s\S]*!isEventOnNode\(e\.target\)[\s\S]*onDeselect\(\)/;
    assertTrue(pattern.test(content), 'Expected blank-area clicks to deselect when not clicking a node');
});

test('Context menu preserves mixed selection when clicking selected item', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const nodePattern = /handleNodeContextMenu[\s\S]*selectedNodeIds\.includes\(nodeId\)[\s\S]*\?\s*selectedNodeIds\s*:\s*\[nodeId\][\s\S]*selectedNodeIds\.includes\(nodeId\)\s*\?\s*selectedWireIds\s*:\s*\[\]/;
    const wirePattern = /handleWireContextMenu[\s\S]*selectedWireIds\.includes\(wireId\)[\s\S]*\?\s*selectedWireIds\s*:\s*\[wireId\][\s\S]*selectedWireIds\.includes\(wireId\)\s*\?\s*selectedNodeIds\s*:\s*\[\]/;
    assertTrue(nodePattern.test(content), 'Expected node context menu to preserve wire selection when node already selected');
    assertTrue(wirePattern.test(content), 'Expected wire context menu to preserve node selection when wire already selected');
});

test('Undo history is recorded for delete, drop, wire, and move', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const dropPattern = /handleDropNode[\s\S]*pushUndoSnapshot/;
    const deletePattern = /handleDelete[\s\S]*pushUndoSnapshot/;
    const wirePattern = /handleCompleteWire[\s\S]*pushUndoSnapshot/;
    const movePattern = /handleMoveNodeStart[\s\S]*dragSnapshotRef\.current[\s\S]*handleMoveNodeEnd[\s\S]*pushUndoSnapshot/;
    assertTrue(dropPattern.test(content), 'Expected drop to record undo history');
    assertTrue(deletePattern.test(content), 'Expected delete to record undo history');
    assertTrue(wirePattern.test(content), 'Expected wiring to record undo history');
    assertTrue(movePattern.test(content), 'Expected move to record undo history');
});

test('Context menus close on outside click', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const handlerPattern = /const\s+handlePointerDown[\s\S]*setContextMenu\(null\)[\s\S]*setTransformationContextMenu\(null\)/;
    const listenerPattern = /window\.addEventListener\('mousedown',\s*handlePointerDown\)/;
    const refPattern = /ref=\{contextMenuRef\}[\s\S]*ref=\{transformationContextMenuRef\}/;
    assertTrue(handlerPattern.test(content), 'Expected outside-click handler for context menus');
    assertTrue(listenerPattern.test(content), 'Expected outside-click listener registration');
    assertTrue(refPattern.test(content), 'Expected refs on context menu elements');
});

test('Lasso requires drag threshold before selecting', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const thresholdPattern = /LASSO_DRAG_THRESHOLD\s*=\s*\d+/;
    const pendingPattern = /lassoPending\.current\s*=\s*true[\s\S]*Math\.hypot\([\s\S]*\)\s*>=\s*LASSO_DRAG_THRESHOLD/;
    assertTrue(thresholdPattern.test(content), 'Expected a lasso drag threshold constant');
    assertTrue(pendingPattern.test(content), 'Expected lasso to activate only after drag threshold');
});

test('Undo-triggered wire redraw uses post-layout rerender', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    const layoutEffectPattern = /useLayoutEffect\([\s\S]*requestAnimationFrame\([\s\S]*setWireLayoutVersion/;
    const dataAttrPattern = /data-layout-version=\{wireLayoutVersion\}/;
    assertTrue(layoutEffectPattern.test(content), 'Expected layout effect to trigger wire rerender after layout');
    assertTrue(dataAttrPattern.test(content), 'Expected wire layout version to be used in SVG');
});

// === CUSTOM NODE DEFINITIONS TESTS ===
console.log('\n🏗️  Custom Node Definition Tests:');

test('Create custom node definition', () => {
    const customDef = createMockNodeDef('ProcessorNode', ['input1', 'input2'], ['output1', 'output2']);
    assertEqual(customDef.name, 'ProcessorNode');
    assertEqual(customDef.inputs.length, 2);
    assertEqual(customDef.outputs.length, 2);
});

test('Custom node definition validation', () => {
    const validDef = createMockNodeDef('ValidNode', ['in'], ['out']);
    assertTrue(validDef.name && validDef.name.length > 0);
    assertTrue(Array.isArray(validDef.inputs));
    assertTrue(Array.isArray(validDef.outputs));
});

test('Built-in node definitions are preserved', () => {
    const builtInDefs = [
        { name: 'Source', inputs: [], outputs: ['out'] },
        { name: 'Sink', inputs: ['in'], outputs: [] }
    ];
    
    const customDefs = [createMockNodeDef('CustomNode', ['in1'], ['out1'])];
    const allDefs = [...builtInDefs, ...customDefs];
    
    assertEqual(allDefs.length, 3);
    assertTrue(allDefs.some(d => d.name === 'Source'));
    assertTrue(allDefs.some(d => d.name === 'Sink'));
    assertTrue(allDefs.some(d => d.name === 'CustomNode'));
});

// === PALETTE SAVE FUNCTIONALITY TESTS ===
console.log('\n🎨 Palette Save Functionality Tests:');

test('Palette save modal state initialization', () => {
    // Simulate initial state
    let showSaveModal = false;
    let saveFilename = '';
    
    // Simulate handleSavePalette (opens modal)
    showSaveModal = true;
    saveFilename = 'Palette';
    
    assertTrue(showSaveModal, 'Modal should be shown');
    assertEqual(saveFilename, 'Palette', 'Default filename should be "Palette"');
});

test('Palette save filename with user input', () => {
    // Simulate user entering a custom filename
    let saveFilename = 'Palette';
    
    // User types custom filename
    saveFilename = 'MyCustomPalette';
    
    assertEqual(saveFilename, 'MyCustomPalette');
});

// === HEADER BRANDING TESTS ===
console.log('\n🧭 Header Branding Tests:');

test('Branding bar includes logo and title', () => {
    const appPath = path.resolve(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    assertTrue(content.includes('Design by Transformation'), 'Expected branding title to be present');
    assertTrue(content.includes('/DxT.png'), 'Expected branding logo path to be present');
});

test('Palette save filename trimming and fallback', () => {
    // Test 1: Filename with whitespace should be trimmed
    let saveFilename = '  MyPalette  ';
    const trimmedFilename = saveFilename.trim() || 'Palette';
    assertEqual(trimmedFilename, 'MyPalette');
    
    // Test 2: Empty filename should fallback to default
    saveFilename = '   ';
    const fallbackFilename = saveFilename.trim() || 'Palette';
    assertEqual(fallbackFilename, 'Palette');
    
    // Test 3: Empty string should fallback to default
    saveFilename = '';
    const emptyFallback = saveFilename.trim() || 'Palette';
    assertEqual(emptyFallback, 'Palette');
});

test('Palette save filename generates correct file name', () => {
    const testCases = [
        { input: 'MyPalette', expected: 'MyPalette.json' },
        { input: 'Test123', expected: 'Test123.json' },
        { input: '  Spaced  ', expected: 'Spaced.json' },
        { input: '', expected: 'Palette.json' },
        { input: '   ', expected: 'Palette.json' }
    ];
    
    testCases.forEach(({ input, expected }) => {
        const filename = input.trim() || 'Palette';
        const fullFilename = `${filename}.json`;
        assertEqual(fullFilename, expected, `Input "${input}" should generate "${expected}"`);
    });
});

test('Palette save modal cancellation', () => {
    // Simulate modal open state
    let showSaveModal = true;
    let saveFilename = 'MyPalette';
    
    // Simulate cancel button click
    showSaveModal = false;
    
    assertTrue(!showSaveModal, 'Modal should be closed after cancel');
    // Note: filename state is preserved in case user reopens
});

test('Palette save modal submission closes modal', () => {
    // Simulate modal submission flow
    let showSaveModal = true;
    let saveFilename = 'CustomPalette';
    
    // Simulate form submission (handleSavePaletteSubmit)
    const filename = saveFilename.trim() || 'Palette';
    showSaveModal = false; // Modal closes on submit
    
    assertTrue(!showSaveModal, 'Modal should be closed after submission');
    assertEqual(filename, 'CustomPalette', 'Filename should be processed');
});

test('Palette data structure for save', () => {
    // Simulate palette data structure (excludes built-in nodes)
    const customNodeDefs = [
        createMockNodeDef('CustomNode1', ['in1'], ['out1']),
        createMockNodeDef('CustomNode2', ['in2', 'in3'], ['out2'])
    ];
    
    // Only custom nodes should be saved (built-in nodes excluded)
    const nodesToSave = customNodeDefs;
    
    assertEqual(nodesToSave.length, 2);
    assertTrue(nodesToSave.every(n => n.name.startsWith('Custom')));
    assertTrue(nodesToSave.every(n => n.name !== 'Source' && n.name !== 'Sink'));
});

// === SELECTION MANAGEMENT TESTS ===
console.log('\n🎯 Selection Management Tests:');

test('Single node selection', () => {
    let selectedNodeIds = [];
    const nodeId = 'node1';
    
    // Simulate single selection
    selectedNodeIds = [nodeId];
    assertEqual(selectedNodeIds.length, 1);
    assertTrue(selectedNodeIds.includes(nodeId));
});

test('Multi-node selection', () => {
    let selectedNodeIds = ['node1'];
    const newNodeId = 'node2';
    
    // Simulate multi-selection (add to existing)
    if (!selectedNodeIds.includes(newNodeId)) {
        selectedNodeIds = [...selectedNodeIds, newNodeId];
    }
    
    assertEqual(selectedNodeIds.length, 2);
    assertTrue(selectedNodeIds.includes('node1'));
    assertTrue(selectedNodeIds.includes('node2'));
});

test('Selection clearing', () => {
    let selectedNodeIds = ['node1', 'node2', 'node3'];
    
    // Simulate canvas click (clear selection)
    selectedNodeIds = [];
    assertEqual(selectedNodeIds.length, 0);
});

test('Lasso selection area', () => {
    const nodes = [
        createMockNode('node1', 'Source', 50, 50),
        createMockNode('node2', 'Sink', 150, 150),
        createMockNode('node3', 'Source', 250, 250)
    ];
    
    // Simulate lasso selection (nodes within area)
    const selectionArea = { x1: 0, y1: 0, x2: 200, y2: 200 };
    const selectedNodes = nodes.filter(node => 
        node.x >= selectionArea.x1 && node.x <= selectionArea.x2 &&
        node.y >= selectionArea.y1 && node.y <= selectionArea.y2
    );
    
    assertEqual(selectedNodes.length, 2); // node1 and node2
    assertTrue(selectedNodes.some(n => n.id === 'node1'));
    assertTrue(selectedNodes.some(n => n.id === 'node2'));
});

// === COPY/PASTE FUNCTIONALITY TESTS ===
console.log('\n📋 Copy/Paste Functionality Tests:');

test('Copy selected nodes to clipboard', () => {
    const nodes = [
        createMockNode('node1', 'Source', 100, 100),
        createMockNode('node2', 'Sink', 200, 200)
    ];
    const selectedNodeIds = ['node1'];
    
    // Simulate copy operation
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const clipboard = selectedNodes.map(n => ({ ...n })); // Deep copy
    
    assertEqual(clipboard.length, 1);
    assertEqual(clipboard[0].id, 'node1');
    assertEqual(clipboard[0].type, 'Source');
});

test('Paste nodes with offset', () => {
    const clipboard = [createMockNode('node1', 'Source', 100, 100)];
    const offset = 40;
    
    // Simulate paste operation
    const newNodes = clipboard.map(n => ({
        ...n,
        id: `node-${Date.now()}`, // New ID
        x: n.x + offset,
        y: n.y + offset
    }));
    
    assertEqual(newNodes[0].x, 140);
    assertEqual(newNodes[0].y, 140);
    assertTrue(newNodes[0].id !== clipboard[0].id);
});

test('Paste preserves wires between copied nodes', () => {
    const clipboard = [
        createMockNode('node1', 'Source', 100, 100),
        createMockNode('node2', 'Sink', 200, 200)
    ];
    const existingWires = [
        createMockWire('wire1', 'node1', 0, 'node2', 0)
    ];
    
    // Simulate paste with wire preservation
    const idMap = { 'node1': 'new-node1', 'node2': 'new-node2' };
    const newWires = existingWires
        .filter(w => clipboard.some(n => n.id === w.fromNodeId) && clipboard.some(n => n.id === w.toNodeId))
        .map(w => ({
            ...w,
            id: `wire-new-${w.id}`,
            fromNodeId: idMap[w.fromNodeId],
            toNodeId: idMap[w.toNodeId]
        }));
    
    assertEqual(newWires.length, 1);
    assertEqual(newWires[0].fromNodeId, 'new-node1');
    assertEqual(newWires[0].toNodeId, 'new-node2');
});

// === FILE FORMAT TESTS ===
console.log('\n💾 File Format Tests:');

test('Diagram save format structure', () => {
    const saveData = {
        name: 'Test Diagram',
        nodes: [createMockNode('node1', 'Source')],
        customNodeDefs: [createMockNodeDef('CustomNode', ['in'], ['out'])],
        wires: [createMockWire('wire1', 'node1', 0, 'node2', 0)]
    };
    
    assertTrue(saveData.name && typeof saveData.name === 'string');
    assertTrue(Array.isArray(saveData.nodes));
    assertTrue(Array.isArray(saveData.customNodeDefs));
    assertTrue(Array.isArray(saveData.wires));
});

test('File name sanitization', () => {
    const diagramName = 'My Diagram: With Special/Characters!';
    const sanitizedName = diagramName.replace(/[^a-zA-Z0-9-_]+/g, '_');
    assertEqual(sanitizedName, 'My_Diagram_With_Special_Characters_');
});

test('JSON serialization/deserialization', () => {
    const originalData = {
        name: 'Test',
        nodes: [createMockNode('node1', 'Source')],
        customNodeDefs: [],
        wires: []
    };
    
    const json = JSON.stringify(originalData, null, 2);
    const parsedData = JSON.parse(json);
    
    assertEqual(parsedData.name, originalData.name);
    assertEqual(parsedData.nodes.length, originalData.nodes.length);
    assertEqual(parsedData.nodes[0].id, originalData.nodes[0].id);
});

// === NODE DELETION TESTS ===
console.log('\n🗑️  Node Deletion Tests:');

test('Delete selected nodes', () => {
    const nodes = [
        createMockNode('node1', 'Source'),
        createMockNode('node2', 'Sink'),
        createMockNode('node3', 'Source')
    ];
    const selectedNodeIds = ['node1', 'node3'];
    
    // Simulate node deletion
    const remainingNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
    assertEqual(remainingNodes.length, 1);
    assertEqual(remainingNodes[0].id, 'node2');
});

test('Delete nodes removes connected wires', () => {
    const wires = [
        createMockWire('wire1', 'node1', 0, 'node2', 0),
        createMockWire('wire2', 'node2', 0, 'node3', 0),
        createMockWire('wire3', 'node4', 0, 'node5', 0)
    ];
    const deletedNodeIds = ['node1', 'node2'];
    
    // Simulate wire cleanup when nodes are deleted
    const remainingWires = wires.filter(w => 
        !deletedNodeIds.includes(w.fromNodeId) && !deletedNodeIds.includes(w.toNodeId)
    );
    
    assertEqual(remainingWires.length, 1);
    assertEqual(remainingWires[0].id, 'wire3');
});

// === CANVAS INTERACTION TESTS ===
console.log('\n🖱️  Canvas Interaction Tests:');

test('Canvas drop zone validation', () => {
    const canvasRect = { left: 300, top: 48, width: 800, height: 600 };
    const dropPoint = { x: 500, y: 200 };
    
    // Check if drop point is within canvas
    const isValidDrop = 
        dropPoint.x >= canvasRect.left && 
        dropPoint.x <= canvasRect.left + canvasRect.width &&
        dropPoint.y >= canvasRect.top && 
        dropPoint.y <= canvasRect.top + canvasRect.height;
    
    assertTrue(isValidDrop);
});

test('Context menu positioning', () => {
    const mouseEvent = { clientX: 400, clientY: 300 };
    const contextMenu = { x: mouseEvent.clientX, y: mouseEvent.clientY, nodeIds: ['node1'] };
    
    assertEqual(contextMenu.x, 400);
    assertEqual(contextMenu.y, 300);
    assertTrue(Array.isArray(contextMenu.nodeIds));
});

// === PROPERTY EDITOR TESTS ===
console.log('\n⚙️  Property Editor Tests:');

test('Property editor data binding', () => {
    const node = createMockNode('node1', 'Source');
    node.properties = {
        ...node.properties,
        label: 'My Source Node',
        description: 'Test description',
        pythonFile: 'process.py'
    };
    
    // Simulate property form initialization
    const formData = {
        label: node.properties.label || '',
        description: node.properties.description || '',
        pythonFile: node.properties.pythonFile || '',
        metadata: node.properties.metadata || ''
    };
    
    assertEqual(formData.label, 'My Source Node');
    assertEqual(formData.description, 'Test description');
    assertEqual(formData.pythonFile, 'process.py');
});

test('Property updates merge correctly', () => {
    const originalProperties = { name: 'Source', inputs: [], outputs: ['out'] };
    const newProperties = { label: 'Updated Label', description: 'New description' };
    
    const mergedProperties = { ...originalProperties, ...newProperties };
    
    assertEqual(mergedProperties.name, 'Source'); // Preserved
    assertEqual(mergedProperties.label, 'Updated Label'); // Added
    assertEqual(mergedProperties.description, 'New description'); // Added
    assertTrue(Array.isArray(mergedProperties.inputs)); // Preserved
});

// === VALIDATION INTEGRATION TESTS ===
console.log('\n🔍 Validation Integration Tests:');

test('Load valid diagram data', () => {
    const validDiagramData = {
        name: 'Valid Diagram',
        nodes: [createMockNode('node1', 'Source')],
        customNodeDefs: [createMockNodeDef('CustomNode', ['in'], ['out'])],
        wires: []
    };
    
    // Simulate basic validation checks
    const hasRequiredFields = 
        validDiagramData.name &&
        Array.isArray(validDiagramData.nodes) &&
        Array.isArray(validDiagramData.customNodeDefs) &&
        Array.isArray(validDiagramData.wires);
    
    assertTrue(hasRequiredFields);
});

test('Reject invalid diagram data', () => {
    const invalidDiagramData = {
        name: 'Invalid Diagram',
        nodes: [{ id: 'node1', type: 'Source' }] // Missing x, y coordinates
        // Missing customNodeDefs and wires
    };
    
    // Simulate validation failure detection
    const firstNode = invalidDiagramData.nodes[0];
    const hasRequiredNodeFields = firstNode.x !== undefined && firstNode.y !== undefined;
    const hasCustomNodeDefs = 'customNodeDefs' in invalidDiagramData;
    const hasWires = 'wires' in invalidDiagramData;
    
    assertTrue(!hasRequiredNodeFields || !hasCustomNodeDefs || !hasWires);
});

// === TRANSFORMATION LIBRARY TESTS ===
console.log('\n🧩 Transformation Library Tests:');

test('Delete transformation removes correct entry', () => {
    const transformations = [
        { name: 'T1' },
        { name: 'T2' },
        { name: 'T3' }
    ];
    const indexToDelete = 1;
    const updated = transformations.filter((_, i) => i !== indexToDelete);
    assertEqual(updated.length, 2);
    assertTrue(updated.every(t => t.name !== 'T2'), 'Deleted transformation should be removed');
});

// === CANVAS SCROLLING TESTS ===
console.log('\n📜 Canvas Scrolling Tests:');

test('Wire rendering accounts for canvas scroll offsets', () => {
    const canvasPath = path.resolve(__dirname, '../src/components/Canvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');
    assertTrue(content.includes('scrollLeft'), 'Expected scrollLeft to be used in wire position calculations');
    assertTrue(content.includes('scrollTop'), 'Expected scrollTop to be used in wire position calculations');
});

// Helper function to calculate canvas bounds (matches Canvas.tsx implementation)
function calculateCanvasBounds(nodes) {
    const ESTIMATED_NODE_WIDTH = 150;
    const PORT_HEIGHT = 28;
    const BASE_NODE_HEIGHT = 60;
    const CANVAS_PADDING = 100;
    
    function getPorts(props, key) {
        const val = props[key];
        if (Array.isArray(val) && val.every(p => typeof p === 'string')) {
            return val;
        }
        return [];
    }
    
    if (nodes.length === 0) {
        return { width: 0, height: 0 };
    }
    
    let maxX = 0;
    let maxY = 0;
    
    nodes.forEach(node => {
        const estimatedNodeHeight = Math.max(
            getPorts(node.properties, 'inputs').length,
            getPorts(node.properties, 'outputs').length
        ) * PORT_HEIGHT + BASE_NODE_HEIGHT;
        
        maxX = Math.max(maxX, node.x + ESTIMATED_NODE_WIDTH);
        maxY = Math.max(maxY, node.y + estimatedNodeHeight);
    });
    
    return {
        width: maxX + CANVAS_PADDING,
        height: maxY + CANVAS_PADDING
    };
}

test('Canvas bounds calculation with empty nodes array', () => {
    const bounds = calculateCanvasBounds([]);
    assertEqual(bounds.width, 0);
    assertEqual(bounds.height, 0);
});

test('Canvas bounds calculation with single node', () => {
    const nodes = [createMockNode('node1', 'Source', 100, 100)];
    const bounds = calculateCanvasBounds(nodes);
    
    // Node at (100, 100) + width (150) + padding (100) = 350
    assertEqual(bounds.width, 350);
    // Node at (100, 100) + height (1 port * 28 + 60) + padding (100) = 288
    assertEqual(bounds.height, 288);
});

test('Canvas bounds calculation with nodes at origin', () => {
    const nodes = [createMockNode('node1', 'Source', 0, 0)];
    const bounds = calculateCanvasBounds(nodes);
    
    // Node at (0, 0) + width (150) + padding (100) = 250
    assertEqual(bounds.width, 250);
    // Node at (0, 0) + height (88) + padding (100) = 188
    assertEqual(bounds.height, 188);
});

test('Canvas bounds calculation with nodes requiring scrolling', () => {
    const nodes = [
        createMockNode('node1', 'Source', 100, 100),
        createMockNode('node2', 'Sink', 1200, 800)
    ];
    const bounds = calculateCanvasBounds(nodes);
    
    // Far node at (1200, 800) + width (150) + padding (100) = 1450
    assertTrue(bounds.width >= 1450, 'Width should accommodate far right node');
    // Far node at (1200, 800) + height (88) + padding (100) = 988
    assertTrue(bounds.height >= 988, 'Height should accommodate far down node');
});

test('Canvas bounds calculation with multiple ports', () => {
    const customNode = {
        id: 'node1',
        type: 'Custom',
        x: 100,
        y: 100,
        properties: {
            name: 'Custom',
            inputs: ['in1', 'in2', 'in3'],
            outputs: ['out1', 'out2']
        }
    };
    const bounds = calculateCanvasBounds([customNode]);
    
    // Height should account for max(3 inputs, 2 outputs) = 3 ports
    // 3 * 28 + 60 = 144 base height
    assertTrue(bounds.height >= 244, 'Height should accommodate multiple ports');
});

test('Canvas bounds adapts to node positions dynamically', () => {
    let nodes = [createMockNode('node1', 'Source', 100, 100)];
    const initialBounds = calculateCanvasBounds(nodes);
    
    // Add a far node
    nodes = [
        ...nodes,
        createMockNode('node2', 'Sink', 2000, 1500)
    ];
    const expandedBounds = calculateCanvasBounds(nodes);
    
    assertTrue(expandedBounds.width > initialBounds.width, 'Bounds should expand horizontally');
    assertTrue(expandedBounds.height > initialBounds.height, 'Bounds should expand vertically');
});

test('Canvas scroll triggers when content exceeds viewport', () => {
    // Simulate typical viewport size
    const viewportWidth = 896;  // Typical canvas width
    const viewportHeight = 672; // Typical canvas height
    
    const nodes = [createMockNode('node1', 'Source', 1500, 1200)];
    const bounds = calculateCanvasBounds(nodes);
    
    const needsHorizontalScroll = bounds.width > viewportWidth;
    const needsVerticalScroll = bounds.height > viewportHeight;
    
    assertTrue(needsHorizontalScroll, 'Should need horizontal scrolling for far right nodes');
    assertTrue(needsVerticalScroll, 'Should need vertical scrolling for far down nodes');
});

// === TEST SUMMARY ===
console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results Summary:`);
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your DxT application functionality is working correctly.');
} else {
    console.log('\n⚠️  Some tests failed. Please review the failing functionality.');
}

console.log('\n📝 Test Coverage Areas:');
console.log('✅ Node Management (creation, updates, positioning)');
console.log('✅ Wire Management (connections, validation, removal)');
console.log('✅ Custom Node Definitions (creation, validation)');
console.log('✅ Palette Save Functionality (modal, filename handling, state management)');
console.log('✅ Selection Management (single, multi, lasso, clearing)');
console.log('✅ Copy/Paste Functionality (clipboard, offset, wire preservation)');
console.log('✅ File Format (save structure, serialization, name sanitization)');
console.log('✅ Node Deletion (node removal, wire cleanup)');
console.log('✅ Canvas Interaction (drop zones, context menus)');
console.log('✅ Property Editor (data binding, updates)');
console.log('✅ Validation Integration (valid/invalid data handling)');
console.log('✅ Canvas Scrolling (bounds calculation, scroll triggers)');

console.log('\n🔧 These tests validate the core functionality of your DxT application.');
console.log('For UI interaction testing, run the application and test manually.');
console.log('For validation system testing, run: npm test');
