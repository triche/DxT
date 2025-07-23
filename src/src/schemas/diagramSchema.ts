// JSON Schema for diagram files
export const diagramSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "DxT Diagram Schema",
  description: "Schema for DxT dataflow diagram files",
  required: ["name", "nodes", "customNodeDefs", "wires"],
  properties: {
    name: {
      type: "string",
      description: "The name of the diagram",
      minLength: 1
    },
    nodes: {
      type: "array",
      description: "Array of nodes in the diagram",
      items: {
        type: "object",
        required: ["id", "type", "x", "y", "properties"],
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for the node",
            minLength: 1
          },
          type: {
            type: "string",
            description: "Type of the node",
            minLength: 1
          },
          x: {
            type: "number",
            description: "X coordinate of the node"
          },
          y: {
            type: "number", 
            description: "Y coordinate of the node"
          },
          properties: {
            type: "object",
            description: "Node properties",
            properties: {
              name: {
                type: "string",
                description: "Display name of the node"
              },
              pythonFile: {
                type: "string",
                description: "Path to the Python file for this node"
              },
              description: {
                type: "string",
                description: "Description of the node"
              },
              metadata: {
                type: "string",
                description: "Additional metadata as JSON string"
              },
              inputs: {
                type: "array",
                description: "Array of input port names",
                items: {
                  type: "string",
                  minLength: 1
                }
              },
              outputs: {
                type: "array",
                description: "Array of output port names", 
                items: {
                  type: "string",
                  minLength: 1
                }
              }
            },
            additionalProperties: true
          }
        },
        additionalProperties: false
      }
    },
    customNodeDefs: {
      type: "array",
      description: "Array of custom node type definitions",
      items: {
        type: "object",
        required: ["name", "inputs", "outputs"],
        properties: {
          name: {
            type: "string",
            description: "Name of the custom node type",
            minLength: 1
          },
          inputs: {
            type: "array",
            description: "Array of input port names",
            items: {
              type: "string",
              minLength: 1
            }
          },
          outputs: {
            type: "array",
            description: "Array of output port names",
            items: {
              type: "string", 
              minLength: 1
            }
          }
        },
        additionalProperties: false
      }
    },
    wires: {
      type: "array",
      description: "Array of wires connecting nodes",
      items: {
        type: "object",
        required: ["id", "fromNodeId", "fromPortIdx", "toNodeId", "toPortIdx"],
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for the wire",
            minLength: 1
          },
          fromNodeId: {
            type: "string",
            description: "ID of the source node",
            minLength: 1
          },
          fromPortIdx: {
            type: "integer",
            description: "Index of the output port on the source node",
            minimum: 0
          },
          toNodeId: {
            type: "string",
            description: "ID of the destination node",
            minLength: 1
          },
          toPortIdx: {
            type: "integer",
            description: "Index of the input port on the destination node",
            minimum: 0
          }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const;
