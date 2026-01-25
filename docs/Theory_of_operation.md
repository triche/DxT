# Theory of Operation: DxT Dataflow Designer

This document describes how the DxT (Design by Transformation) application
operates, including architecture, features, implementation choices, and the
end-user experience. It reflects the current implementation in the
repository.

## 1) System Overview

DxT is a browser-based visual editor for designing dataflow diagrams. Users
drag node types from a palette onto a canvas, wire outputs to inputs, and
edit node properties through a sliding property editor. The application is
implemented as a React + TypeScript SPA, built with Vite.

Key capabilities include:

- Node creation and positioning via drag-and-drop.
- Interactive wiring with live draft previews and connection rules.
- Single and multi-selection, lasso selection, copy/paste, and delete.
- Undo of diagram edits (drop, wire, delete, layout) with a 20-action buffer.
- Palette management (create, save, load custom node types).
- Diagram persistence to JSON with schema validation on load.
- Property editing with immediate updates and batch editing support.
- Transformation library management (load, save, delete transformations).
- Transformation application based on external port patterns.

## 2) Application Architecture

### 2.1 Core Components and Responsibilities

- **App**: Central state owner and coordinator. Holds diagram state,
  handles file I/O, selection, clipboard, transformation logic, and wire
  rules. Renders `Palette`, `Canvas`, the sliding `PropertyEditor`, and the
  Transformation Library.
- **Palette**: Left panel with built-in and custom node types. Supports
  creating new node definitions and saving/loading palette JSON. Implements
  drag source behavior for node creation.
- **Canvas**: Right panel where nodes and wires are rendered. Handles
  drag/drop placement, node movement, selection (click, shift-click,
  lasso), wiring interactions, and keyboard shortcuts.
- **PropertyEditor**: Sliding right-side panel that updates node
  properties immediately. Supports batch editing by showing consistent
  values across selected nodes.

### 2.2 Data Model

The diagram is represented by three primary collections and a diagram name:

- **Nodes**: Each node has `id`, `type`, `x`, `y`, and a `properties`
  dictionary. The `properties` include `name`, `inputs`, `outputs`, and
  optional metadata like `pythonFile`, `description`, `metadata`.
- **Wires**: Each wire stores `id`, `fromNodeId`, `fromPortIdx`,
  `toNodeId`, `toPortIdx`.
- **Custom node definitions**: Each definition has `name`, `inputs`,
  `outputs`.
- **Diagram name**: Used for display and filename generation.
- **Transformations**: Each transformation defines `name`, `inputPattern`,
  `outputPattern`, and `replacementNodes`.

Schemas are enforced through JSON validation utilities, ensuring that
imported diagrams and palettes conform to expected structures.

### 2.3 State Management

State is managed via React `useState` and coordinated in `App`:

- `nodes`, `wires`, `customNodeDefs`
- `selectedNodeIds`, `selectedWireIds`, `wireDraft`, `clipboard`
- `diagramName`, `contextMenu`
- `transformations`, `transformationContextMenu`,
  `showSaveTransformationModal`, `pendingTransformation`

`Canvas` uses `useRef` for DOM measurements to compute port centers for
wiring and for lasso selection based on node DOM bounds.

### 2.4 Rendering and Layout

The layout uses a fixed top bar and a three-column horizontal split with precise viewport sizing:

- **Top bar**: Save, Load, Save Transformation, Clear, Diagram Cleanup, and diagram name input (fixed, 48px height).
- **Left pane**: Palette (20vw width, scrollable vertically).
- **Center pane**: Canvas (60vw width, scrollable horizontally and vertically).
- **Right pane**: Transformation Library and Property Editor (20vw width, relative positioned).

The canvas implements dynamic content bounds calculation that accounts for nodes positioned anywhere in 2D space, including negative coordinates. This allows nodes to be placed outside the initial viewport, with automatic scrollbars enabling access to all content.

Wire rendering is done via SVG polylines, positioned behind nodes and ports for clear visual hierarchy. The SVG layer expands to cover the full scrollable canvas area.

## 3) Feature Behavior and UX

### 3.1 Node Creation and Movement

- Drag a node type from the palette and drop it on the canvas. The drop
  coordinates are computed relative to the canvas.
- Nodes can be repositioned by clicking and dragging. Movement updates the
  node coordinates in real time.

### 3.2 Selection Model

- **Single select**: Click a node or wire to select it.
- **Multi-select**: Shift+click to add nodes or wires to the selection.
- **Lasso select**: Click and drag on empty canvas to draw a selection
  rectangle. Nodes whose DOM bounds intersect the lasso are selected. Wires
  whose bounding box intersects the lasso are also selected.
- **Deselect**: Click empty canvas or press Escape.
- **Select all**: Ctrl/Cmd+A selects all nodes and wires.

Selected nodes receive a blue highlight, glow, and dashed outline when
multi-selected. Selected wires appear in blue with increased thickness (3px
vs 2px) to indicate selection state.

### 3.3 Wiring

- Start a wire by mousing down on an output port (blue lollipop).
- A draft wire follows the cursor and renders as a dotted right-angled
  polyline.
- Complete a wire by releasing over an input port (green lollipop).
- Multiple wires may connect to a given input port; outputs can also connect to
  multiple inputs.
- If wiring is canceled (mouse up on empty canvas), the draft is discarded.
- Wires can be selected by clicking on them, added to multi-selections with
  Shift+click, or included in lasso selections.
- Selected wires appear blue and thicker (3px vs 2px) for visual feedback.
- Wires can be deleted via the Delete key, Backspace, or context menu.

### 3.4 Canvas Scrolling and Coordinate System

The canvas implements intelligent scrolling to handle nodes placed anywhere in 2D space:

- **Dynamic Bounds Calculation**: The canvas automatically calculates content bounds based on all node positions, including nodes with negative coordinates.
- **Offset System**: The canvas maintains offset values (`offsetX`, `offsetY`) that translate between viewport coordinates and node coordinates, allowing nodes to be positioned at any location including negative values.
- **Automatic Scrollbars**: Horizontal and vertical scrollbars appear automatically when nodes extend beyond the visible viewport in any direction.
- **Content Wrapper**: A positioned wrapper div expands dynamically to encompass all nodes plus padding (`CANVAS_PADDING = 100px`), ensuring the scrollable area always covers all content.
- **Scroll Preservation**: Node positioning, drag operations, and wire rendering all account for the canvas offset, maintaining correct behavior regardless of scroll position.

Key implementation constants:
- `ESTIMATED_NODE_WIDTH`: 150px (used for bounds calculation)
- `PORT_HEIGHT`: 28px (vertical spacing per port)
- `BASE_NODE_HEIGHT`: 60px (minimum node height)
- `CANVAS_PADDING`: 100px (extra space around content bounds)

This design ensures that nodes placed during transformation application or manual positioning remain accessible, even if they fall outside the initial viewport.

### 3.5 Property Editing

- When exactly one node is selected, the property editor slides in from
  the right. It displays:
  - Node type (read-only)
  - Node name
  - Python file path
  - Description
  - Input and output ports (read-only list)
- Changes apply immediately across selected nodes (batch edit) when
  multiple nodes share the same property value.

### 3.6 Clipboard Operations

- **Copy** (Ctrl/Cmd+C): Stores selected nodes in a local clipboard.
- **Paste** (Ctrl/Cmd+V): Creates new nodes with new IDs and an offset, so
  they don’t overlap. Wires between copied nodes are duplicated and remapped
  to new IDs.
- **Delete** (Delete/Backspace): Removes selected nodes and selected wires.
  When nodes are deleted, any wires connected to them are also removed.
  Wires can be deleted independently without affecting nodes.

### 3.7 Undo

- **Undo** (Ctrl/Cmd+Z): Reverts the last diagram change, with a rolling
  buffer of the most recent 20 actions.
- Undo applies to node drops, wiring changes, deletions, and layout
  (position) changes.
- Selection changes are not recorded as undoable actions.

### 3.8 Context Menu

- Right-click on a node or wire to open a context menu. If multiple nodes or
  wires are selected, the menu applies to the entire selection.
- Actions: Delete (for both nodes and wires) and Apply Transformation (for
  nodes only, with applicable transformations shown).
- Mixed selections of nodes and wires are supported; the context menu shows
  appropriate options based on the selection.

- Right-click on a transformation card in the Transformation Library to
  open a context menu with Delete.

### 3.9 Palette Management

- Built-in node types: **Source** (outputs only) and **Sink** (inputs
  only).
- Users can create new node types via a modal form. Input/output ports are
  entered as comma-separated lists.
- **Save Palette**: Exports custom node definitions only as JSON.
- **Load Palette**: Imports JSON and validates with the palette schema.
  Name conflicts are resolved by auto-incrementing (e.g., `MyNode1`).
- Uses the File System Access API when available; otherwise falls back to
  file input and download links.

### 3.10 Diagram Persistence

- **Save Diagram**: Exports `name`, `nodes`, `customNodeDefs`, and `wires`
  as JSON. The filename is sanitized to remove unsafe characters.
- **Load Diagram**: Reads JSON, validates against the diagram schema, and
  updates application state. Invalid files are rejected with a formatted
  error list.

### 3.11 Diagram Cleanup

- **Purpose**: Automatically rearranges nodes to improve readability and
  clarify wiring flow.
- **Leftmost placement**: Nodes with no input ports are anchored to the left
  of the visible diagram. If none exist, nodes with unwired input ports are
  treated as the leftmost group.
- **Rightmost placement**: Nodes with no output ports are moved to the right.
  If none exist, nodes with unwired output ports are treated as the
  rightmost group.
- **Ordering**: Nodes with both inputs and outputs are ordered left-to-right
  based on wiring direction. When there is insufficient visible width,
  additional columns flow off the right side while keeping leftmost nodes in
  view.

### 3.12 Transformation Management

- **Transformation Library**: A right-side panel listing loaded
  transformations. Cards show name, input ports, and output ports.
- **Load Transformation**: Loads a transformation JSON file and validates it
  against the transformation schema.
- **Save Transformation**: Exports the current diagram as a transformation.
  Unwired input ports become `inputPattern`; unwired output ports become
  `outputPattern`. The transformation name comes from the diagram name
  field. A modal asks whether to also add it to the library.
- **Apply Transformation**: From the node context menu, only transformations
  whose external port multiset matches the selection are shown. External
  ports include unconnected ports or ports wired to nodes outside the
  selection. Internal wires are ignored.
- **Wiring on Apply**: Replacement nodes are offset to the selection’s top
  left. External wires are reconnected by matching port names; unmatched
  replacement ports remain unconnected.

## 4) Implementation Choices and Rationale

### 4.1 React + TypeScript

React provides predictable state-driven rendering, and TypeScript enforces
type safety for node, wire, and palette structures. The app’s event model
is implemented with React handlers plus window-level listeners for global
keyboard shortcuts.

### 4.2 DOM-Driven Geometry

Port centers and lasso selection are computed from real DOM measurements.
This avoids complex layout math and keeps wire rendering accurate even with
variable node sizes.

### 4.3 Schema Validation

Palette and diagram files are validated using lightweight JSON schema
validation. This ensures loading is safe, and data formats remain stable as
features evolve.

### 4.4 File Operations

The File System Access API is used when available for native save/load UX,
with browser-safe fallbacks to maintain compatibility.

### 4.5 Containerized Deployment

DxT can be built and served as static assets in a container. A multi-stage
Docker build compiles the Vite app, then serves the `dist/` output with
Nginx. This provides a lightweight, production-style runtime that runs
locally on Docker Desktop.

## 5) UX and Visual Design

- **Visual language**: Blue for outputs and selection, green for inputs.
  Neutral grays for surfaces and borders.
- **Hierarchy**: Wires render beneath nodes; ports and selection indicators
  remain visible and interactive.
- **Feedback**: Draft wire previews, hoverable draggable nodes, and
  selection glow provide immediate feedback.
- **Accessibility**: Keyboard shortcuts are enabled and prevented from
  interfering with text inputs; contrast and spacing support clarity.

## 6) Current Limitations and Non-Goals

- Diagram execution is not implemented; nodes are structural only.
- Property editor does not currently validate or parse metadata JSON.
- Multi-node property editing is limited to fields with shared values.

## 7) Future Extensions (Aligned with Design by Transformation)

The conceptual model supports transformations such as refinement and
optimization, where a node or subgraph can be replaced by an equivalent
subgraph with identical interface ports. Runtime semantics and execution
are planned extensions.
