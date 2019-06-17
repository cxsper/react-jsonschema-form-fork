import _ from 'lodash';
import { adapterTypeMappings } from './adapterTypeMappings';

/**
 * Adapt data schema for a form
 * @param schema
 * @returns form schema
 */
export const adaptSchema = schema => {
  const adaptedSchema = {
    schema: {
      type: 'object',
      properties: {},
    },
    uiSchema: {},
    formData: {},
    conditionalSchema: {
      type: 'object',
      properties: {},
    },
    conditionalRequiredFields: {},
  };

  const removeHiddenFields = (fields, fieldNames) =>
    fieldNames.filter(fieldName => fields[fieldName].showInForm);

  const prioritizeRequiredFields = (fields, fieldNames) =>
    fieldNames.sort((fieldName, anotherFieldName) => {
      if (
        fields[fieldName].required === true &&
        fields[anotherFieldName].required === true
      ) {
        return 0;
      }

      if (fields[fieldName].required === true) {
        return -1;
      }
      if (fields[anotherFieldName].required === true) {
        return 1;
      }
      return 0;
    });

  const checkAndSetProperty = (
    field,
    path,
    name,
    _schema,
    propertyPath = name,
  ) => {
    if (_.get(field, propertyPath) !== undefined) {
      _.set(_schema.properties, `${path}.${name}`, _.get(field, propertyPath));
    }
  };

  const checkFieldList = (field, path, uiPath, _schema) => {
    if (field.list !== undefined) {
      _.set(_schema.properties, `${path}.list`, field.list);

      const { url, method } = field.list;
      let listType = 'list-select';
      if (url !== undefined && method !== undefined) {
        listType = 'dynamic-list';
      }
      _.set(adaptedSchema.uiSchema, `${uiPath}.ui:widget`, listType);
    }
  };

  const checkFieldRequired = (
    field,
    fieldName,
    path,
    abstractContextPath,
    contextPath,
    schemaFieldContextPath,
    _schema,
  ) => {
    const requiredPath = schemaFieldContextPath;

    if (requiredPath.length !== 0) {
      if (_.get(_schema.properties, `${requiredPath}.required`) === undefined) {
        _.set(_schema.properties, `${requiredPath}.required`, []);
      }
    }
    if (field.required === true) {
      if (requiredPath.length !== 0) {
        _.set(_schema.properties, `${requiredPath}.required`, [
          ..._.get(_schema.properties, `${requiredPath}.required`),
          fieldName,
        ]);
      } else {
        _schema.required = [..._schema.required, fieldName]; // eslint-disable-line
      }
    } else if (typeof field.required === 'string') {
      _.set(
        adaptedSchema.conditionalRequiredFields,
        path.replace(/\./g, '_').replace(/0/g, 'INDEX'),
        {
          required: field.required,
          schemaContext: abstractContextPath,
          formContext: contextPath,
        },
      );
    }
  };

  const checkFieldUiSchema = (fieldMapping, uiPath) => {
    if (fieldMapping.uiSchema) {
      _.set(adaptedSchema.uiSchema, uiPath, fieldMapping.uiSchema);
    }
  };

  const setSchemaForField = (
    field,
    fieldName,
    conditionalFieldPath,
    fieldMapping,
    contextPath,
    _schema,
  ) => {
    _.set(_schema.properties, conditionalFieldPath, {
      title: field.fullName,
      contextPath,
      fieldName,
      ...fieldMapping.schema,
    });
  };

  const buildPaths = (
    isFieldConditional,
    fieldNamePath,
    fieldName,
    schemaContextPath,
    contextPath,
    path,
  ) => {
    let fieldContextPath = contextPath;
    let uiFieldPath = fieldNamePath.replace(/_/g, '.');
    const delimiterSign = isFieldConditional ? '_' : '.';
    const schemaFieldContextPath = schemaContextPath;
    const abstractSchemaFieldContextPath = schemaFieldContextPath
      .replace(/0/g, 'INDEX')
      .replace(/_/g, '.');

    let conditionalFieldPath = isFieldConditional
      ? path.replace(/\./g, '_').replace(/0/, 'INDEX')
      : path;

    if (conditionalFieldPath.length !== 0) {
      conditionalFieldPath += delimiterSign;
    }

    if (uiFieldPath.length !== 0) {
      uiFieldPath += '.';
    }

    if (fieldContextPath.length !== 0) {
      fieldContextPath += '.';
    }

    conditionalFieldPath += fieldName;
    uiFieldPath += fieldName;
    fieldContextPath += fieldName;

    return {
      conditionalFieldPath,
      uiFieldPath,
      fieldContextPath,
      abstractSchemaFieldContextPath,
      schemaFieldContextPath,
    };
  };

  const buildSchemaForArray = (
    field,
    path,
    uiPath,
    contextPath,
    isConditional,
    _schema,
  ) => {
    /* eslint-disable no-case-declarations */
    const itemPathSegment = 'items.0';
    const itemPath = `${path}.${itemPathSegment}`;
    const itemUiPath = `${uiPath}.${itemPathSegment}`;
    const itemPropertiesPath = `${itemPath}.properties`;
    const itemTypePath = `${itemPath}.type`;
    const itemContextPath = `${contextPath}.INDEX`;
    _.set(_schema.properties, itemTypePath, 'object');
    rebuildSchema(
      field,
      itemPropertiesPath,
      itemUiPath,
      itemContextPath,
      itemPath,
      isConditional,
    );
    _.set(
      _schema.properties,
      `${path}.additionalItems`,
      _.get(_schema.properties, itemPath),
    );
    _.set(_schema.properties, `${path}.schemaPath`, path.replace(/_/g, '.'));
    _.set(
      adaptedSchema.uiSchema,
      `${uiPath}.additionalItems`,
      _.get(adaptedSchema.uiSchema, itemUiPath),
    );
  };

  const rebuildSchema = (
    rebuiltSchema,
    path = '',
    fieldNamePath = '',
    contextPath = '',
    schemaContextPath = '',
    isFieldInnerOfConditional = false,
  ) => {
    const { fields } = rebuiltSchema;

    /* eslint-disable no-shadow */
    const schema = isFieldInnerOfConditional
      ? adaptedSchema.conditionalSchema
      : adaptedSchema.schema;

    if (fieldNamePath.length === 0) {
      schema.required = [];
    }

    const fieldNames = Object.keys(fields);

    const shownFieldNames = removeHiddenFields(fields, fieldNames);
    const sortedFieldNames = prioritizeRequiredFields(fields, shownFieldNames);

    sortedFieldNames
      // build schema for fields
      .forEach(fieldName => {
        const field = fields[fieldName];
        const fieldType = field.subtype || field.type;

        if (fieldType === 'Group') {
          return;
        }

        const fieldMapping = adapterTypeMappings[fieldType];

        const isFieldConditional = typeof field.show === 'string';

        const schema =
          isFieldConditional || isFieldInnerOfConditional
            ? adaptedSchema.conditionalSchema
            : adaptedSchema.schema;

        const {
          conditionalFieldPath,
          uiFieldPath,
          fieldContextPath,
          abstractSchemaFieldContextPath,
          schemaFieldContextPath,
        } = buildPaths(
          isFieldConditional,
          fieldNamePath,
          fieldName,
          schemaContextPath,
          contextPath,
          path,
        );

        setSchemaForField(
          field,
          fieldName,
          conditionalFieldPath,
          fieldMapping,
          contextPath,
          schema,
        );
        checkFieldUiSchema(fieldMapping, uiFieldPath);
        checkFieldRequired(
          field,
          fieldName,
          conditionalFieldPath,
          abstractSchemaFieldContextPath,
          contextPath,
          schemaFieldContextPath,
          schema,
        );
        checkFieldList(field, conditionalFieldPath, uiFieldPath, schema);
        checkAndSetProperty(field, conditionalFieldPath, 'lookup', schema);
        checkAndSetProperty(
          field,
          conditionalFieldPath,
          'orderable',
          schema,
          'parameters.reordering',
        );
        checkAndSetProperty(field, conditionalFieldPath, 'formWidth', schema);
        checkAndSetProperty(
          field,
          conditionalFieldPath,
          'parameters.options',
          schema,
        );
        checkAndSetProperty(field, conditionalFieldPath, 'show', schema);
        checkAndSetProperty(field, conditionalFieldPath, 'arguments', schema);

        checkAndSetProperty(field, conditionalFieldPath, 'fieldInfo', schema);

        if (field.fields) {
          switch (fieldMapping.schema.type) {
            case 'array':
              buildSchemaForArray(
                field,
                conditionalFieldPath,
                uiFieldPath,
                fieldContextPath,
                isFieldConditional || isFieldInnerOfConditional,
                schema,
              );
              break;
            case 'object':
              rebuildSchema(
                field,
                `${conditionalFieldPath}.properties`,
                uiFieldPath,
                fieldContextPath,
                conditionalFieldPath,
                isFieldConditional || isFieldInnerOfConditional,
              );
              break;
            default:
          }
        }
      });
  };

  rebuildSchema(schema);

  return { ...adaptedSchema };
};
