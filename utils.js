import React from 'react';
import fill from 'core-js/library/fn/array/fill';
import validateFormData from './validate';

export const ADDITIONAL_PROPERTY_FLAG = '__additional_property';

const widgetMap = {
  boolean: {
    checkbox: 'CheckboxWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    hidden: 'HiddenWidget',
  },
  string: {
    text: 'TextWidget',
    password: 'PasswordWidget',
    email: 'EmailWidget',
    hostname: 'TextWidget',
    ipv4: 'TextWidget',
    ipv6: 'TextWidget',
    uri: 'URLWidget',
    'data-url': 'FileWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    textarea: 'TextareaWidget',
    hidden: 'HiddenWidget',
    date: 'DateWidget',
    datetime: 'DateTimeWidget',
    'date-time': 'DateTimeWidget',
    color: 'ColorWidget',
    file: 'FileWidget',
    'list-select': 'ListSelect',
    'lookup-select': 'LookupSelect',
    'multi-lookup-select': 'MultiLookupSelect',
    'dynamic-list': 'DynamicList',
  },
  number: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  integer: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  array: {
    select: 'SelectWidget',
    checkboxes: 'CheckboxesWidget',
    files: 'FileWidget',
    file: 'FileWidget',
    hidden: 'HiddenWidget',
    tags: 'TagsWidget',
  },
};

export function getDefaultRegistry() {
  return {
    fields: require('./components/fields').default, // eslint-disable-line
    widgets: require('./components/widgets').default, // eslint-disable-line
    definitions: {},
    formContext: {},
  };
}

export function getSchemaType(schema) {
  let { type } = schema;

  if (!type && schema.const) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    type = 'string';
  }
  return type;
}

export function getWidget(schema, widget, registeredWidgets = {}) {
  const type = getSchemaType(schema);

  function mergeOptions(Widget) {
    // cache return value as property of widget for proper react reconciliation
    if (!Widget.MergedWidget) {
      const defaultOptions =
        (Widget.defaultProps && Widget.defaultProps.options) || {};
      /* eslint-disable no-param-reassign */
      Widget.MergedWidget = ({ options = {}, ...props }) => (
        <Widget options={{ ...defaultOptions, ...options }} {...props} />
      );
    }
    return Widget.MergedWidget;
  }

  if (typeof widget === 'function') {
    return mergeOptions(widget);
  }

  if (typeof widget !== 'string') {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }

  if (Object.prototype.hasOwnProperty.call(registeredWidgets, widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  if (!Object.prototype.hasOwnProperty.call(widgetMap, type)) {
    throw new Error(`No widget for type "${type}"`);
  }

  if (Object.prototype.hasOwnProperty.call(widgetMap[type], widget)) {
    const registeredWidget = registeredWidgets[widgetMap[type][widget]];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  throw new Error(`No widget "${widget}" for type "${type}"`);
}

function computeDefaults(schema, parentDefaults, definitions = {}) {
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults, schema.default);
  } else if ('default' in schema) {
    // Use schema defaults for this node.
    defaults = schema.default;
  } else if ('$ref' in schema) {
    // Use referenced schema defaults for this node.
    const refSchema = findSchemaDefinition(schema.$ref, definitions);
    return computeDefaults(refSchema, defaults, definitions);
  } else if (isFixedItems(schema)) {
    defaults = schema.items.map(itemSchema =>
      computeDefaults(itemSchema, undefined, definitions),
    );
  }
  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === 'undefined') {
    defaults = schema.default;
  }

  switch (schema.type) {
    // We need to recur for object schema inner default values.
    case 'object':
      return Object.keys(schema.properties || {}).reduce((acc, key) => {
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        acc[key] = computeDefaults(
          schema.properties[key],
          (defaults || {})[key],
          definitions,
        );
        return acc;
      }, {});

    case 'array':
      if (schema.minItems) {
        if (!isMultiSelect(schema, definitions)) {
          const defaultsLength = defaults ? defaults.length : 0;
          if (schema.minItems > defaultsLength) {
            const defaultEntries = defaults || [];
            // populate the array with the defaults
            const fillerSchema = Array.isArray(schema.items)
              ? schema.additionalItems
              : schema.items;
            const fillerEntries = fill(
              new Array(schema.minItems - defaultsLength),
              computeDefaults(fillerSchema, fillerSchema.defaults, definitions),
            );
            // then fill up the rest with either the item default or empty, up to minItems

            return defaultEntries.concat(fillerEntries);
          }
        } else {
          return [];
        }
      }
      break;
    default:
  }
  return defaults;
}

export function getDefaultFormState(_schema, formData, definitions = {}) {
  if (!isObject(_schema)) {
    throw new Error(`Invalid schema: ${_schema}`);
  }
  const schema = retrieveSchema(_schema, definitions, formData);
  const defaults = computeDefaults(schema, _schema.default, definitions);
  if (typeof formData === 'undefined') {
    return defaults;
  }
  if (isObject(formData)) {
    return mergeObjects(defaults, formData);
  }
  return formData || defaults;
}

export function getUiOptions(uiSchema) {
  return Object.keys(uiSchema)
    .filter(key => key.indexOf('ui:') === 0)
    .reduce((options, key) => {
      const value = uiSchema[key];

      if (key === 'ui:widget' && isObject(value)) {
        return {
          ...options,
          ...(value.options || {}),
          widget: value.component,
        };
      }
      if (key === 'ui:options' && isObject(value)) {
        return { ...options, ...value };
      }
      return { ...options, [key.substring(3)]: value };
    }, {});
}

export function isObject(thing) {
  return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
}

export function mergeObjects(obj1, obj2, concatArrays = false) {
  const acc = Object.assign({}, obj1); // Prevent mutation of source object.

  return Object.keys(obj2).reduce((accumulated, key) => {
    const accumulatedCopy = Object.assign({}, accumulated);
    const left = obj1 ? obj1[key] : {};
    const right = obj2[key];

    if (
      obj1 &&
      Object.prototype.hasOwnProperty.call(obj1, key) &&
      isObject(right)
    ) {
      accumulatedCopy[key] = mergeObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      accumulatedCopy[key] = left.concat(right);
    } else {
      accumulatedCopy[key] = right;
    }
    return accumulatedCopy;
  }, acc);
}

export function asNumber(value) {
  if (value === '') {
    return undefined;
  }
  if (/\.$/.test(value)) {
    return value;
  }
  if (/\.0$/.test(value)) {
    return value;
  }
  const n = Number(value);
  const valid = typeof n === 'number' && !Number.isNaN(n);

  if (/\.\d*0$/.test(value)) {
    return value;
  }

  return valid ? n : value;
}

export function orderProperties(properties, order) {
  if (!Array.isArray(order)) {
    return properties;
  }

  const arrayToHash = arr =>
    arr.reduce((prev, curr) => {
      const prevCopy = Object.assign({}, prev);
      prevCopy[curr] = true;
      return prevCopy;
    }, {});
  const errorPropList = arr =>
    arr.length > 1
      ? `properties '${arr.join("', '")}'`
      : `property '${arr[0]}'`;
  const propertyHash = arrayToHash(properties);
  const orderHash = arrayToHash(order);
  const extraneous = order.filter(prop => prop !== '*' && !propertyHash[prop]);
  if (extraneous.length) {
    throw new Error(
      `uiSchema order list contains extraneous ${errorPropList(extraneous)}`,
    );
  }
  const rest = properties.filter(prop => !orderHash[prop]);
  const restIndex = order.indexOf('*');
  if (restIndex === -1) {
    if (rest.length) {
      throw new Error(
        `uiSchema order list does not contain ${errorPropList(rest)}`,
      );
    }
    return order;
  }
  if (restIndex !== order.lastIndexOf('*')) {
    throw new Error('uiSchema order list contains more than one wildcard item');
  }

  const complete = [...order];
  complete.splice(restIndex, 1, ...rest);
  return complete;
}

export function isConstant(schema) {
  return (
    (Array.isArray(schema.enum) && schema.enum.length === 1) ||
    Object.prototype.hasOwnProperty.call(schema, 'const')
  );
}

export function toConstant(schema) {
  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return schema.enum[0];
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'const')) {
    return schema.const;
  }
  throw new Error('schema cannot be inferred as a constant');
}

export function isSelect(_schema, definitions = {}) {
  const schema = retrieveSchema(_schema, definitions);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  }
  if (Array.isArray(altSchemas)) {
    return altSchemas.every(altSchema => isConstant(altSchema));
  }
  return false;
}

export function isMultiSelect(schema, definitions = {}) {
  if (!schema.uniqueItems || !schema.items) {
    return false;
  }
  return isSelect(schema.items, definitions);
}

export function isFilesArray(schema, uiSchema, definitions = {}) {
  if (uiSchema['ui:widget'] === 'files') {
    return true;
  }
  if (schema.items) {
    const itemsSchema = retrieveSchema(schema.items, definitions);
    return itemsSchema.type === 'string' && itemsSchema.format === 'data-url';
  }
  return false;
}

export function isFixedItems(schema) {
  return (
    Array.isArray(schema.items) &&
    schema.items.length > 0 &&
    schema.items.every(item => isObject(item))
  );
}

export function allowAdditionalItems(schema) {
  if (schema.additionalItems === true) {
    console.warn('additionalItems=true is currently not supported');
  }
  return isObject(schema.additionalItems);
}

export function optionsList(schema) {
  if (schema.enum) {
    return schema.enum.map((value, i) => {
      const label = (schema.enumNames && schema.enumNames[i]) || String(value);
      return { label, value };
    });
  }
  const altSchemas = schema.oneOf || schema.anyOf;
  return altSchemas.map(altSchema => {
    const value = toConstant(altSchema);
    const label = altSchema.title || String(value);
    return { label, value };
  });
}

function findSchemaDefinition($ref, definitions = {}) {
  const match = /^#\/definitions\/(.*)$/.exec($ref);
  if (match && match[1]) {
    const parts = match[1].split('/');
    let current = definitions;
    parts.forEach(part => {
      const partCopy = part.replace(/~1/g, '/').replace(/~0/g, '~');
      while (Object.prototype.hasOwnProperty.call(current, '$ref')) {
        current = findSchemaDefinition(current.$ref, definitions);
      }
      if (Object.prototype.hasOwnProperty.call(current, partCopy)) {
        current = current[partCopy];
      } else {
        throw new Error(`Could not find a definition for ${$ref}.`);
      }
    });
    return current;
  }

  throw new Error(`Could not find a definition for ${$ref}.`);
}

export const guessType = function guessType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (value == null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (!Number.isNaN(value)) {
    return 'number';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  return 'string';
};

// This function will create new "properties" items for each key in our formData
export function stubExistingAdditionalProperties(
  originalSchema,
  definitions = {}, // eslint-disable-line
  formData = {},
) {
  // Clone the schema so we don't ruin the consumer's original
  const schema = {
    ...originalSchema,
    properties: { ...originalSchema.properties },
  };
  Object.keys(formData).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      return;
    }
    const additionalProperties = Object.prototype.hasOwnProperty.call(
      schema.additionalProperties,
      'type',
    )
      ? { ...schema.additionalProperties }
      : { type: guessType(formData[key]) };
    // The type of our new key should match the additionalProperties value;
    schema.properties[key] = additionalProperties;
    // Set our additional property flag so we know it was dynamically added
    schema.properties[key][ADDITIONAL_PROPERTY_FLAG] = true;
  });
  return schema;
}

export function resolveSchema(schema, definitions = {}, formData = {}) {
  if (Object.prototype.hasOwnProperty.call(schema, '$ref')) {
    return resolveReference(schema, definitions, formData);
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'dependencies')) {
    const resolvedSchema = resolveDependencies(schema, definitions, formData);
    return retrieveSchema(resolvedSchema, definitions, formData);
  }
  return schema;
}

function resolveReference(schema, definitions, formData) {
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, definitions);
  // Drop the $ref property of the source schema.
  const { $ref, ...localSchema } = schema;
  // Update referenced schema definition with local schema properties.
  return retrieveSchema(
    { ...$refSchema, ...localSchema },
    definitions,
    formData,
  );
}

export function retrieveSchema(schema, definitions = {}, formData = {}) {
  const resolvedSchema = resolveSchema(schema, definitions, formData);
  const hasAdditionalProperties =
    Object.prototype.hasOwnProperty.call(
      resolvedSchema,
      'additionalProperties',
    ) && resolvedSchema.additionalProperties !== false;
  if (hasAdditionalProperties) {
    return stubExistingAdditionalProperties(
      resolvedSchema,
      definitions,
      formData,
    );
  }
  return resolvedSchema;
}

function resolveDependencies(schema, definitions, formData) {
  // Drop the dependencies from the source schema.
  const { dependencies = {} } = schema;
  let { resolvedSchema } = schema;
  // Process dependencies updating the local schema properties as appropriate.
  Object.keys(dependencies).forEach(dependencyKey => {
    // Skip this dependency if its trigger property is not present.
    if (formData[dependencyKey] === undefined) {
      return;
    }
    const dependencyValue = dependencies[dependencyKey];
    if (Array.isArray(dependencyValue)) {
      resolvedSchema = withDependentProperties(resolvedSchema, dependencyValue);
    } else if (isObject(dependencyValue)) {
      resolvedSchema = withDependentSchema(
        resolvedSchema,
        definitions,
        formData,
        dependencyKey,
        dependencyValue,
      );
    }
  });
  return resolvedSchema;
}

function withDependentProperties(schema, additionallyRequired) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required };
}

function withDependentSchema(
  originalSchema,
  definitions,
  formData,
  dependencyKey,
  dependencyValue,
) {
  const { oneOf, ...dependentSchema } = retrieveSchema(
    dependencyValue,
    definitions,
    formData,
  );
  const schema = mergeSchemas(originalSchema, dependentSchema);
  // Since it does not contain oneOf, we return the original schema.
  if (oneOf === undefined) {
    return schema;
  }
  if (!Array.isArray(oneOf)) {
    throw new Error(`invalid: it is some ${typeof oneOf} instead of an array`);
  }
  // Resolve $refs inside oneOf.
  const resolvedOneOf = oneOf.map(
    subschema =>
      Object.prototype.hasOwnProperty.call(subschema, '$ref')
        ? resolveReference(subschema, definitions, formData)
        : subschema,
  );
  return withExactlyOneSubschema(
    schema,
    definitions,
    formData,
    dependencyKey,
    resolvedOneOf,
  );
}

function withExactlyOneSubschema(
  schema,
  definitions,
  formData,
  dependencyKey,
  oneOf,
) {
  const validSubschemas = oneOf.filter(subschema => {
    if (!subschema.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema = {
        type: 'object',
        properties: {
          [dependencyKey]: conditionPropertySchema,
        },
      };
      const { errors } = validateFormData(formData, conditionSchema);
      return errors.length === 0;
    }

    return true;
  });
  if (validSubschemas.length !== 1) {
    console.warn(
      "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid",
    );
    return schema;
  }
  const subschema = validSubschemas[0];
  const {
    [dependencyKey]: conditionPropertySchema,
    ...dependentSubschema
  } = subschema.properties;
  const dependentSchema = { ...subschema, properties: dependentSubschema };
  return mergeSchemas(
    schema,
    retrieveSchema(dependentSchema, definitions, formData),
  );
}

function mergeSchemas(schema1, schema2) {
  return mergeObjects(schema1, schema2, true);
}

function isArguments(object) {
  return Object.prototype.toString.call(object) === '[object Arguments]';
}

export function deepEquals(a, b, ca = [], cb = []) {
  // Partially extracted from node-deeper and adapted to exclude comparison
  // checks for functions.
  // https://github.com/othiym23/node-deeper
  if (a === b) {
    return true;
  }
  if (typeof a === 'function' || typeof b === 'function') {
    // Assume all functions are equivalent
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return (
      a.source === b.source &&
      a.global === b.global &&
      a.multiline === b.multiline &&
      a.lastIndex === b.lastIndex &&
      a.ignoreCase === b.ignoreCase
    );
  }
  if (isArguments(a) || isArguments(b)) {
    if (!(isArguments(a) && isArguments(b))) {
      return false;
    }
    const { slice } = Array.prototype;
    return deepEquals(slice.call(a), slice.call(b), ca, cb);
  }
  if (a.constructor !== b.constructor) {
    return false;
  }

  const ka = Object.keys(a);
  const kb = Object.keys(b);
  // don't bother with stack acrobatics if there's nothing there
  if (ka.length === 0 && kb.length === 0) {
    return true;
  }
  if (ka.length !== kb.length) {
    return false;
  }

  let cal = ca.length;
  while (cal) {
    if (ca[cal] === a) {
      return cb[cal] === b;
    }

    cal -= 1;
  }
  ca.push(a);
  cb.push(b);

  ka.sort();
  kb.sort();
  for (let j = ka.length - 1; j >= 0; j -= 1) {
    if (ka[j] !== kb[j]) {
      return false;
    }
  }

  let key;
  for (let k = ka.length - 1; k >= 0; k -= 1) {
    key = ka[k];
    if (!deepEquals(a[key], b[key], ca, cb)) {
      return false;
    }
  }

  ca.pop();
  cb.pop();

  return true;
}

export function shouldRender(comp, nextProps, nextState) {
  const { props, state } = comp;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}

export function toIdSchema(
  schema,
  id,
  definitions,
  formData = {},
  idPrefix = 'root',
) {
  const idSchema = {
    $id: id || idPrefix,
  };
  if ('$ref' in schema || 'dependencies' in schema) {
    /* eslint-disable no-underscore-dangle */
    const _schema = retrieveSchema(schema, definitions, formData);
    return toIdSchema(_schema, id, definitions, formData, idPrefix);
  }
  if ('items' in schema && !schema.items.$ref) {
    return toIdSchema(schema.items, id, definitions, formData, idPrefix);
  }
  if (schema.type !== 'object') {
    return idSchema;
  }
  Object.keys(schema.properties || {}).forEach(name => {
    const field = schema.properties[name];
    const fieldId = `${idSchema.$id}_${name}`;
    idSchema[name] = toIdSchema(
      field,
      fieldId,
      definitions,
      (formData || {})[name],
      idPrefix,
    );
  });

  return idSchema;
}

export function parseDateString(dateString, includeTime = true) {
  if (!dateString) {
    return {
      year: -1,
      month: -1,
      day: -1,
      hour: includeTime ? -1 : 0,
      minute: includeTime ? -1 : 0,
      second: includeTime ? -1 : 0,
    };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Unable to parse date ${dateString}`);
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // oh you, javascript.
    day: date.getUTCDate(),
    hour: includeTime ? date.getUTCHours() : 0,
    minute: includeTime ? date.getUTCMinutes() : 0,
    second: includeTime ? date.getUTCSeconds() : 0,
  };
}

export function toDateString(
  { year, month, day, hour = 0, minute = 0, second = 0 },
  time = true,
) {
  const utcTime = Date.UTC(year, month - 1, day, hour, minute, second);
  const datetime = new Date(utcTime).toJSON();
  return time ? datetime : datetime.slice(0, 10);
}

export function pad(num, size) {
  let s = String(num);
  while (s.length < size) {
    s = `0${s}`;
  }
  return s;
}

export function setState(instance, state, callback) {
  const { safeRenderCompletion } = instance.props;
  if (safeRenderCompletion) {
    instance.setState(state, callback);
  } else {
    instance.setState(state);
    setImmediate(callback);
  }
}

export function dataURItoBlob(dataURI) {
  const splitted = dataURI.split(',');
  const params = splitted[0].split(';');
  const type = params[0].replace('data:', '');
  const properties = params.filter(param => param.split('=')[0] === 'name');
  let name;
  if (properties.length !== 1) {
    name = 'unknown';
  } else {
    [, name] = properties[0].split('=');
  }

  const binary = atob(splitted[1]);
  const array = [];
  for (let i = 0; i < binary.length; i += 1) {
    array.push(binary.charCodeAt(i));
  }
  const blob = new window.Blob([new Uint8Array(array)], { type });

  return { blob, name };
}

export function rangeSpec(schema) {
  const spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum || schema.minimum === 0) {
    spec.min = schema.minimum;
  }
  if (schema.maximum || schema.maximum === 0) {
    spec.max = schema.maximum;
  }
  return spec;
}
