/**
 * Schema type to form type mappings
 * where schema is form field schema
 * where schema.type is a type for ajv & our form fields
 * where shema.format is ajv format for a field
 * where schema.items is schema for a nested items
 * where uiSchema is UI schema for our form
 * where uiSchema['ui:widget'] is widget to be displayed
 * where uiSchema.items is UI schema for nested items
 */
export const adapterTypeMappings = {
  DynamicList: {
    schema: {
      type: 'string',
    },
    uiSchema: {
      'ui:widget': 'dynamic-list',
    },
  },
  Number: {
    schema: {
      type: 'number',
    },
  },
  String: {
    schema: {
      type: 'string',
    },
  },
  Url: {
    schema: {
      type: 'string',
      format: 'uri',
    },
  },
  Text: {
    schema: {
      type: 'string',
    },
    uiSchema: {
      'ui:widget': 'textarea',
    },
  },
  Object: {
    schema: {
      type: 'object',
    },
  },
  Array: {
    schema: {
      type: 'array',
    },
  },
  File: {
    schema: {
      type: 'object',
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  'File[]': {
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  Date: {
    schema: {
      type: 'string',
      format: 'date',
    },
  },
  DateTime: {
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  Boolean: {
    schema: {
      type: 'boolean',
    },
  },
  Mixed: {
    schema: {
      type: 'object',
    },
  },
  ObjectID: {
    schema: { type: 'string' },
  },
  LookupObjectID: {
    schema: {
      type: 'string',
    },
    uiSchema: {
      'ui:widget': 'lookup-select',
    },
  },
  'String[]': {
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    uiSchema: {
      'ui:widget': 'tags',
    },
  },
  'Date[]': {
    schema: {
      type: 'array',
      items: {
        type: 'string',
        format: 'date',
      },
    },
  },
  'DateTime[]': {
    schema: {
      type: 'array',
      items: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  'Number[]': {
    schema: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
  'Boolean[]': {
    schema: {
      type: 'array',
      items: {
        type: 'boolean',
      },
    },
  },
  'Mixed[]': {
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  },
  'Object[]': {
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  },
  'ObjectID[]': {
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  'LookupObjectID[]': {
    schema: {
      type: 'string',
    },
    uiSchema: {
      'ui:widget': 'multi-lookup-select',
    },
  },
  Image: {
    schema: {
      type: 'object',
      contentType: 'image/*',
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  Video: {
    schema: {
      type: 'object',
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  Audio: {
    schema: {
      type: 'object',
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  'Image[]': {
    schema: {
      type: 'array',
      contentType: 'image/*',
      items: {
        type: 'object',
      },
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  'Video[]': {
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
  'Audio[]': {
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    uiSchema: {
      'ui:widget': 'file',
    },
  },
};
