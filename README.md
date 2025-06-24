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
