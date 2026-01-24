# Design by Transformation (DxT)

DxT is a browser-based dataflow designer for creating and editing node
graphs. Users drag node types from a palette onto a canvas, wire outputs to
inputs, and edit node properties in a sliding panel. Diagrams and palettes
can be saved/loaded as JSON with schema validation.

## Core Functionality (Concise)

- Drag-and-drop node creation from a palette.
- Interactive wiring with draft previews and connection rules.
- Selection tools: click, shift-click, lasso, and select-all.
- Clipboard: copy, paste (with wire preservation), delete.
- Property editing with immediate updates.
- Diagram save/load (JSON) and palette save/load.

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
5. **Edit properties**: Select a single node to open the sliding property
   editor on the right.
6. **Save/Load**: Use the top bar to save or load diagrams as JSON.
7. **Palette management**: Create custom node types, then save/load palette
   JSON from the palette panel.

### Keyboard Shortcuts

- Copy: Ctrl/Cmd+C
- Paste: Ctrl/Cmd+V
- Delete: Delete/Backspace
- Select all: Ctrl/Cmd+A
- Deselect: Escape

## File Formats

- **Diagram JSON**: Includes diagram name, nodes, custom node definitions,
  and wires. Validated on load.
- **Palette JSON**: Custom node definitions only (built-ins excluded).

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
│   └── run-tests.cjs
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
