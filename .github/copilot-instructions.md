<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilot-instructionsmd-file -->

# DxT (Design by Transformation) Project Instructions

This is a React + TypeScript web application for designing dataflow
diagrams. The current implementation focuses on a visual editor (palette,
canvas, wiring, selection, property editing, and JSON persistence). Runtime
execution and transformation application are conceptual extensions, not
implemented.

## Core Architecture

**Layout:** 30/70 split layout with palette on left, canvas on right, and a
sliding property editor from the right. Fixed top bar for diagram name,
save/load/clear.

**Key Components:**
- `App.tsx` - Main application with state management and event handlers
- `Canvas.tsx` - Main canvas area with node rendering, wiring, and interactions
- `Palette.tsx` - Draggable component palette with custom node creation
- `PropertyEditor.tsx` - Sliding panel for editing node properties
- Modular Canvas components (present but currently not the primary render
	path): `Node.tsx`, `Port.tsx`, `WireLayer.tsx`, `Lasso.tsx`

## Feature Set (Current Implementation)

### Node Management
- **Drag & Drop:** Drag components from palette to canvas
- **Node Movement:** Click and drag nodes to reposition
- **Node Selection:** Single click to select, Shift+click for multi-select
- **Lasso Selection:** Click and drag on empty canvas to create selection rectangle
- **Visual Feedback:** Selected nodes have blue border, glow effect, and dashed outline for multi-select
- **Context Menu:** Right-click for delete option
- **Node Types:** Built-in Source/Sink nodes + unlimited custom node types
- **Properties:** Name, Python file path, description, metadata, input/output
	port definitions

### Wiring System
- **Interactive Wiring:** Drag from output ports (blue circles) to input ports (green circles)
- **Visual Ports:** Output ports on right edge, input ports on left edge of nodes
- **Wire Rendering:** Right-angled polylines with SVG-based wire layer
- **Draft Wires:** Dotted line preview while dragging connections
- **Connection Rules:** One wire per input port, unlimited outputs
- **Auto-cleanup:** Wires removed when connected nodes are deleted

### Selection & Editing
- **Multi-select:** Shift+click, lasso selection, or Ctrl/Cmd+A for select all
- **Copy/Paste:** Ctrl/Cmd+C to copy, Ctrl/Cmd+V to paste (includes connected wires)
- **Delete:** Delete key, Backspace, or context menu to remove selected nodes
- **Property Editing:** Sliding panel appears when single node selected
- **Immediate Updates:** Real-time property changes reflected in canvas
- **Batch Editing:** Multi-select shows combined properties where applicable

### Keyboard Shortcuts
- **Copy:** Ctrl/Cmd+C - Copy selected nodes
- **Paste:** Ctrl/Cmd+V - Paste nodes with offset positioning
- **Delete:** Delete/Backspace - Remove selected nodes and connected wires
- **Select All:** Ctrl/Cmd+A - Select all nodes on canvas
- **Deselect:** Escape - Clear all selections
- **Prevent Conflicts:** Shortcuts disabled when editing text inputs

### Palette Management
- **Built-in Nodes:** Source (output only), Sink (input only)
- **Custom Nodes:** Create new node types with configurable input/output ports
- **Node Creation Modal:** Form to define node name and port specifications
- **Palette Persistence:** Save/load palette configurations as JSON
- **Name Conflict Resolution:** Auto-increment names when loading duplicate
	types
- **Visual Design:** Consistent styling with drag handles and port information

### File Operations
- **Save/Load:** JSON format for complete diagram persistence
- **Data Structure:** Includes nodes, custom node definitions, wires, and diagram metadata
- **Local File System:** Browser-based file operations with fallback support
- **File System Access API:** Modern browsers get native file picker
	integration
- **Error Handling:** Graceful fallback for unsupported browsers or invalid files

### Visual Design System
- **Modern UI:** Clean, professional interface with consistent spacing
- **Color Coding:** Blue for outputs/selection, green for inputs, gray for neutral
- **Visual Hierarchy:** Z-index management for proper layering (wires behind, ports on top)
- **Responsive Elements:** Hover states, cursor changes, and visual feedback
- **Accessibility:** Proper contrast ratios and keyboard navigation support

### State Management
- **React Hooks:** useState and useEffect for component state
- **Ref Management:** useRef for DOM element references and port tracking
- **Event Handling:** Comprehensive mouse, keyboard, and drag event system
- **Performance:** Optimized rendering with proper dependency arrays

### Development Standards
- **TypeScript:** Full type safety with proper interfaces and type definitions
- **Code Organization:** Modular component structure with clear separation of concerns
- **Error Prevention:** Comprehensive error handling and input validation
- **Browser Compatibility:** Cross-browser support with feature detection
- **Development Tools:** ESLint, Vite, and modern React development practices

## Transformation Concepts

The application models two transformation types conceptually:

1. **Refinement:** Replace a node with a more detailed/platform-specific
	version.
2. **Optimization:** Replace a node or group with a more efficient
	implementation.

These concepts inform the editor design but are not executed in the current
codebase.

## Key Implementation Notes

- Follow the specification in docs/Theory_of_operation.md for all features.
- Maintain consistent styling and interaction patterns across components.
- Ensure proper TypeScript typing for all props and state.
- Use proper React patterns with hooks and functional components.
- Implement comprehensive keyboard and mouse interaction support.
- Favor minimal, targeted edits that preserve current UX behavior.
