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
- Palette management (create, save, load custom node types).
- Diagram persistence to JSON with schema validation on load.
- Property editing with immediate updates and batch editing support.

## 2) Application Architecture

### 2.1 Core Components and Responsibilities

- **App**: Central state owner and coordinator. Holds diagram state,
  handles file I/O, selection, clipboard, and wire rules. Renders
  `Palette`, `Canvas`, and the sliding `PropertyEditor`.
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

Schemas are enforced through JSON validation utilities, ensuring that
imported diagrams and palettes conform to expected structures.

### 2.3 State Management

State is managed via React `useState` and coordinated in `App`:

- `nodes`, `wires`, `customNodeDefs`
- `selectedNodeIds`, `wireDraft`, `clipboard`
- `diagramName`, `contextMenu`

`Canvas` uses `useRef` for DOM measurements to compute port centers for
wiring and for lasso selection based on node DOM bounds.

### 2.4 Rendering and Layout

The layout uses a fixed top bar and a horizontal split:

- **Top bar**: Save, Load, Clear, and diagram name input.
- **Left pane**: Palette (approximately 30% width, scrollable).
- **Right pane**: Canvas (approximately 70% width, scrollable) with a
  sliding property editor on the far right.

Wire rendering is done via SVG polylines, positioned behind nodes and ports
for clear visual hierarchy.

## 3) Feature Behavior and UX

### 3.1 Node Creation and Movement

- Drag a node type from the palette and drop it on the canvas. The drop
  coordinates are computed relative to the canvas.
- Nodes can be repositioned by clicking and dragging. Movement updates the
  node coordinates in real time.

### 3.2 Selection Model

- **Single select**: Click a node to select it.
- **Multi-select**: Shift+click to add nodes to the selection.
- **Lasso select**: Click and drag on empty canvas to draw a selection
  rectangle. Nodes whose DOM bounds intersect the lasso are selected.
- **Deselect**: Click empty canvas or press Escape.
- **Select all**: Ctrl/Cmd+A selects all nodes.

Selected nodes receive a blue highlight, glow, and dashed outline when
multi-selected.

### 3.3 Wiring

- Start a wire by mousing down on an output port (blue lollipop).
- A draft wire follows the cursor and renders as a dotted right-angled
  polyline.
- Complete a wire by releasing over an input port (green lollipop).
- Only one wire may connect to a given input port; outputs can connect to
  multiple inputs.
- If wiring is canceled (mouse up on empty canvas), the draft is discarded.

### 3.4 Property Editing

- When exactly one node is selected, the property editor slides in from
  the right. It displays:
  - Node type (read-only)
  - Node name
  - Python file path
  - Description
  - Input and output ports (read-only list)
- Changes apply immediately across selected nodes (batch edit) when
  multiple nodes share the same property value.

### 3.5 Clipboard Operations

- **Copy** (Ctrl/Cmd+C): Stores selected nodes in a local clipboard.
- **Paste** (Ctrl/Cmd+V): Creates new nodes with new IDs and an offset, so
  they don’t overlap. Wires between copied nodes are duplicated and remapped
  to new IDs.
- **Delete** (Delete/Backspace): Removes selected nodes and any wires
  attached to them.

### 3.6 Context Menu

- Right-click on a node to open a context menu. If multiple nodes are
  selected, the menu applies to the selection.
- The only action in the current menu is Delete.

### 3.7 Palette Management

- Built-in node types: **Source** (outputs only) and **Sink** (inputs
  only).
- Users can create new node types via a modal form. Input/output ports are
  entered as comma-separated lists.
- **Save Palette**: Exports custom node definitions only as JSON.
- **Load Palette**: Imports JSON and validates with the palette schema.
  Name conflicts are resolved by auto-incrementing (e.g., `MyNode1`).
- Uses the File System Access API when available; otherwise falls back to
  file input and download links.

### 3.8 Diagram Persistence

- **Save Diagram**: Exports `name`, `nodes`, `customNodeDefs`, and `wires`
  as JSON. The filename is sanitized to remove unsafe characters.
- **Load Diagram**: Reads JSON, validates against the diagram schema, and
  updates application state. Invalid files are rejected with a formatted
  error list.

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
subgraph with identical interface ports. This document describes the
current editor; transformation execution and runtime semantics are planned
extensions.
