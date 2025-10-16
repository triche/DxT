import { diagramSchema } from '../schemas/diagramSchema';
import { paletteSchema } from '../schemas/paletteSchema';

// Type for validation errors
export type ValidationError = {
  path: string;
  message: string;
  value?: unknown;
};

// Basic JSON Schema type definitions
type JSONSchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';

interface JSONSchemaBase {
  type: JSONSchemaType;
  description?: string;
}

interface JSONSchemaObject extends JSONSchemaBase {
  type: 'object';
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

interface JSONSchemaArray extends JSONSchemaBase {
  type: 'array';
  items?: JSONSchema;
}

interface JSONSchemaString extends JSONSchemaBase {
  type: 'string';
  minLength?: number;
  maxLength?: number;
}

interface JSONSchemaNumber extends JSONSchemaBase {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
}

type JSONSchema = JSONSchemaObject | JSONSchemaArray | JSONSchemaString | JSONSchemaNumber | JSONSchemaBase;

// Simple JSON Schema validator
class JSONValidator {
  private validateType(value: unknown, expectedType: string, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      errors.push({
        path,
        message: `Expected ${expectedType}, got ${actualType}`,
        value
      });
    }
    
    return errors;
  }

  private validateObject(value: unknown, schema: JSONSchemaObject, path: string = ''): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({
        path,
        message: `Expected object, got ${Array.isArray(value) ? 'array' : typeof value}`,
        value
      });
      return errors;
    }

    const obj = value as Record<string, unknown>;

    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in obj)) {
          errors.push({
            path: path ? `${path}.${requiredProp}` : requiredProp,
            message: `Missing required property '${requiredProp}'`
          });
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(obj)) {
        const propSchema = schema.properties[key];
        const propPath = path ? `${path}.${key}` : key;
        
        if (propSchema) {
          errors.push(...this.validateValue(value, propSchema, propPath));
        } else if (schema.additionalProperties === false) {
          errors.push({
            path: propPath,
            message: `Additional property '${key}' is not allowed`
          });
        }
      }
    }

    return errors;
  }

  private validateArray(value: unknown, schema: JSONSchemaArray, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!Array.isArray(value)) {
      errors.push({
        path,
        message: `Expected array, got ${typeof value}`,
        value
      });
      return errors;
    }

    // Validate array items
    if (schema.items) {
      value.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        errors.push(...this.validateValue(item, schema.items!, itemPath));
      });
    }

    return errors;
  }

  private validateString(value: unknown, schema: JSONSchemaString, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'string') {
      errors.push({
        path,
        message: `Expected string, got ${typeof value}`,
        value
      });
      return errors;
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String length ${value.length} is less than minimum ${schema.minLength}`,
        value
      });
    }

    return errors;
  }

  private validateNumber(value: unknown, schema: JSONSchemaNumber, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'number') {
      errors.push({
        path,
        message: `Expected number, got ${typeof value}`,
        value
      });
      return errors;
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Number ${value} is less than minimum ${schema.minimum}`,
        value
      });
    }

    return errors;
  }

  private validateInteger(value: unknown, schema: JSONSchemaNumber, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        path,
        message: `Expected integer, got ${typeof value}`,
        value
      });
      return errors;
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Integer ${value} is less than minimum ${schema.minimum}`,
        value
      });
    }

    return errors;
  }

  private validateValue(value: unknown, schema: JSONSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (schema.type) {
      case 'object':
        errors.push(...this.validateObject(value, schema as JSONSchemaObject, path));
        break;
      case 'array':
        errors.push(...this.validateArray(value, schema as JSONSchemaArray, path));
        break;
      case 'string':
        errors.push(...this.validateString(value, schema as JSONSchemaString, path));
        break;
      case 'number':
        errors.push(...this.validateNumber(value, schema as JSONSchemaNumber, path));
        break;
      case 'integer':
        errors.push(...this.validateInteger(value, schema as JSONSchemaNumber, path));
        break;
      default:
        // For basic type validation
        errors.push(...this.validateType(value, schema.type, path));
    }

    return errors;
  }

  validate(data: unknown, schema: JSONSchema): ValidationError[] {
    return this.validateValue(data, schema, '');
  }
}

const validator = new JSONValidator();

// Validation functions
export function validateDiagram(data: unknown): ValidationError[] {
  return validator.validate(data, diagramSchema);
}

export function validatePalette(data: unknown): ValidationError[] {
  return validator.validate(data, paletteSchema);
}

// Helper to format validation errors for user display
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  const errorMessages = errors.map(error => 
    error.path ? `${error.path}: ${error.message}` : error.message
  );
  
  return `Validation errors:\n${errorMessages.join('\n')}`;
}
