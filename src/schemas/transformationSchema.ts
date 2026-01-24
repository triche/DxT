// JSON Schema for transformation files
export const transformationSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "DxT Transformation Schema",
  description: "Schema for DxT transformation files",
  required: ["name", "inputPattern", "outputPattern", "replacementNodes"],
  properties: {
    name: {
      type: "string",
      description: "The name of the transformation",
      minLength: 1
    },
    inputPattern: {
      type: "array",
      description: "List of required input port names",
      items: {
        type: "string",
        minLength: 1
      }
    },
    outputPattern: {
      type: "array",
      description: "List of required output port names",
      items: {
        type: "string",
        minLength: 1
      }
    },
    replacementNodes: {
      type: "array",
      description: "Nodes that replace the selected nodes",
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
    }
  },
  additionalProperties: false
} as const;
