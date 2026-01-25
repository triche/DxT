# Design by Transformation (DxT)

DxT is a browser-based dataflow designer for creating and editing node
graphs. Users drag node types from a palette onto a canvas, wire outputs to
inputs, and edit node properties in a sliding panel. Diagrams and palettes
can be saved/loaded as JSON with schema validation.

Transformations can be loaded, saved, and applied to selections based on
external port patterns.

## Core Functionality (Concise)

- Drag-and-drop node creation from a palette.
- Interactive wiring with draft previews and connection rules.
- Selection tools for nodes and wires: click, shift-click, lasso, and select-all.
- Clipboard: copy, paste (with wire preservation), delete nodes and wires.
- Property editing with immediate updates.
- Diagram save/load (JSON) and palette save/load.
- Diagram cleanup for automatic left-to-right layout.
- Transformation library (load, save, delete) and apply from context menu.
- Load Transformation button in the library to import transformation JSON files.

## Installation

```bash
npm install
```

## Run the Application

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Run with Docker (Local)

### Option A: Docker CLI

```bash
docker build -t dxt .
docker run --rm -p 8080:80 dxt
```

Open http://localhost:8080

### Option B: Docker Compose

```bash
docker compose up --build
```

Open http://localhost:8080

### Option C: Docker Compose Detached

```bash
docker compose up -d --build
```

Open http://localhost:8080

## Build for Production

```bash
npm run build
```

## Tests

```bash
npm test
```

## Basic Usage

1. **Create nodes**: Drag a node type from the palette to the canvas.
2. **Wire nodes**: Drag from an output port (blue) to an input port (green).
3. **Move nodes**: Click and drag a node on the canvas.
4. **Select nodes**: Click to select, Shift+click to multi-select, or drag
   on empty canvas to lasso-select.
5. **Select wires**: Click on a wire to select it, Shift+click to multi-select
   wires, or use lasso selection. Selected wires appear blue and thicker.
6. **Delete nodes/wires**: Select elements and press Delete/Backspace, or
   right-click and choose Delete from the context menu.
7. **Undo**: Press Ctrl/Cmd+Z to undo the last diagram change (up to 20 actions).
8. **Edit properties**: Select a single node to open the sliding property
   editor on the right.
9. **Save/Load**: Use the top bar to save or load diagrams as JSON.
10. **Palette management**: Create custom node types, then save/load palette
   JSON from the palette panel.
11. **Save transformation**: Use Save Transformation to export the current
    diagram into a transformation JSON (based on unwired ports). Choose to
    add it to the Transformation Library.
12. **Apply transformation**: Right-click a node selection and choose
    Apply Transformation from the context menu.
13. **Diagram cleanup**: Use Diagram Cleanup in the top bar to rearrange
   nodes into a clear left-to-right flow.
14. **Load transformation**: Use the Load Transformation button in the
   Transformation Library to import transformation JSON files into the
   library.

### Keyboard Shortcuts

- Copy: Ctrl/Cmd+C (copies selected nodes)
- Paste: Ctrl/Cmd+V (pastes nodes with offset)
- Delete: Delete/Backspace (removes selected nodes and wires)
- Undo: Ctrl/Cmd+Z (undoes last diagram change; 20-step buffer)
- Select all: Ctrl/Cmd+A (selects all nodes and wires)
- Deselect: Escape (clears all selections)

## File Formats

- **Diagram JSON**: Includes diagram name, nodes, custom node definitions,
  and wires. Validated on load.
- **Palette JSON**: Custom node definitions only (built-ins excluded).
- **Transformation JSON**: Includes transformation name, input/output
   patterns, and replacement nodes.

## Project Structure

```
DxT/
├── docs/                   # Documentation
│   ├── ImplementationOptions.md
│   └── Theory_of_operation.md
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── Canvas/         # Canvas-related components
│   │   ├── Canvas.tsx      # Main canvas component
│   │   ├── Palette.tsx     # Component palette
│   │   └── PropertyEditor.tsx
│   ├── schemas/            # JSON schemas for validation
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── test/                   # Test suite
│   ├── validation-test.cjs
│   ├── app-functionality.test.cjs
│   ├── transformation-applicability.test.cjs
│   ├── transformation-apply.test.cjs
│   └── run-tests.cjs
├── samples/                # Sample JSON files
│   ├── diagram.json
│   ├── palette.json
│   └── transformation.json
├── public/                 # Static assets
├── index.html              # HTML entry point
├── Dockerfile              # Container build (multi-stage)
├── docker-compose.yml      # Local container orchestration
├── nginx.conf              # Nginx config for SPA routing
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── tsconfig*.json          # TypeScript configuration
```

## Linting

```bash
npm run lint
```

## Documentation

- Theory of operation: [docs/Theory_of_operation.md](docs/Theory_of_operation.md)
- Testing details: [test/README.md](test/README.md)

## License

This repository is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).
