# Design by Transformation (DxT)

## Introduction

Design by Transformation (DxT) is a web-based application that allows users
to create dataflow designs by dragging and dropping components onto a
canvas. The application provides a palette of components, each with
configurable properties, which can be connected to form complex
data-processing workflows.

While the creation of the applications by hand is possible, the true power
in the DxT application is the ability to apply transformations to dataflow
designs. The two major types of transformations supported are:

1. **Refinement**: Replace a node with a more detailed version of itself.
   Often this may use more platform specific components, more complex
   logic, or more detailed configuration.
2. **Optimization**: Replace a node or group of nodes with a more efficient
   version.

In either case, the new graph of nodes must have the same number of inputs
and outputs as the original node or group of nodes. This allows the new
graph to be used in place of the original graph without changing the
overall structure of the dataflow.

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
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── tsconfig*.json          # TypeScript configuration
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

For more details on testing, see [test/README.md](test/README.md).
