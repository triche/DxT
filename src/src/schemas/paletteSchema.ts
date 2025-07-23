// JSON Schema for palette files
export const paletteSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  title: "DxT Palette Schema",
  description: "Schema for DxT palette files containing custom node definitions",
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
} as const;
