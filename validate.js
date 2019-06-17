/* eslint-disable no-underscore-dangle */
import toPath from 'lodash.topath';
import Ajv from 'ajv';
import _ from 'lodash';
import { isObject, mergeObjects } from './utils';

/**
 * Modifies default ajv validate method to exclude some object-string schema cases
 */
const validate = (schemaKeyRef, data, ajv) => {
  let v;
  if (typeof schemaKeyRef === 'string') {
    v = ajv.getSchema(schemaKeyRef);
    if (!v) throw new Error(`no schema with key or ref ${schemaKeyRef}`);
  } else {
    const schemaObj = ajv._addSchema(schemaKeyRef);
    v = schemaObj.validate || ajv._compile(schemaObj);
  }

  const valid = v(data);
  /* eslint-disable no-param-reassign */
  if (v.$async !== true) ajv.errors = v.errors;
  ajv.errors = ajv.errors || [];
  ajv.errors = ajv.errors.filter(error => {
    const fieldFormData = _.get(data, error.dataPath.slice(1));
    if (error.params.type === 'string' && typeof fieldFormData === 'object') {
      return false;
    }

    /* Skip empty value string validation */
    if (fieldFormData === undefined && error.params.type === 'string') {
      return false;
    }

    return true;
  });

  if (ajv.errors.length === 0) {
    return true;
  }

  return valid;
};

const ajv = new Ajv({
  errorDataPath: 'property',
  allErrors: true,
  multipleOfPrecision: 8,
});
// add custom formats
ajv.addFormat(
  'data-url',
  /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/,
);
ajv.addFormat(
  'color',
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,
);

function toErrorSchema(errors) {
  // Transforms a ajv validation errors list:
  // [
  //   {property: ".level1.level2[2].level3", message: "err a"},
  //   {property: ".level1.level2[2].level3", message: "err b"},
  //   {property: ".level1.level2[4].level3", message: "err b"},
  // ]
  // Into an error tree:
  // {
  //   level1: {
  //     level2: {
  //       2: {level3: {errors: ["err a", "err b"]}},
  //       4: {level3: {errors: ["err b"]}},
  //     }
  //   }
  // };
  if (!errors.length) {
    return {};
  }
  return errors.reduce((errorSchema, error) => {
    const { property, message } = error;
    const path = toPath(property);
    let parent = errorSchema;

    if (path.length > 0 && path[0] === '') {
      path.splice(0, 1);
    }

    path.slice(0).forEach(segment => {
      if (!(segment in parent)) {
        parent[segment] = {};
      }
      parent = parent[segment];
    });

    if (Array.isArray(parent.__errors)) {
      parent.__errors = parent.__errors.concat(message);
    } else {
      parent.__errors = [message];
    }
    return errorSchema;
  }, {});
}

export function toErrorList(errorSchema, fieldName = 'root') {
  let errorList = [];
  if ('__errors' in errorSchema) {
    errorList = errorList.concat(
      errorSchema.__errors.map(stack => ({
        stack: `${fieldName}: ${stack}`,
      })),
    );
  }
  return Object.keys(errorSchema).reduce((acc, key) => {
    let accumulated = acc;
    if (key !== '__errors') {
      accumulated = accumulated.concat(toErrorList(errorSchema[key], key));
    }
    return accumulated;
  }, errorList);
}

function createErrorHandler(formData) {
  const handler = {
    __errors: [],
    addError(message) {
      this.__errors.push(message);
    },
  };
  if (isObject(formData)) {
    return Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: createErrorHandler(formData[key]) }),
      handler,
    );
  }
  if (Array.isArray(formData)) {
    return formData.reduce(
      (acc, value, key) => ({ ...acc, [key]: createErrorHandler(value) }),
      handler,
    );
  }
  return handler;
}

function unwrapErrorHandler(errorHandler) {
  return Object.keys(errorHandler).reduce((acc, key) => {
    if (key === 'addError') {
      return acc;
    }
    if (key === '__errors') {
      return { ...acc, [key]: errorHandler[key] };
    }
    return { ...acc, [key]: unwrapErrorHandler(errorHandler[key]) };
  }, {});
}

function transformAjvErrors(errors = []) {
  if (errors === null) {
    return [];
  }

  return errors.map(e => {
    const { dataPath, keyword, message, params } = e;
    const property = `${dataPath}`;

    return {
      name: keyword,
      property,
      message,
      params,
      stack: `${property} ${message}`.trim(),
    };
  });
}

export default function validateFormData(
  formData,
  schema,
  customValidate,
  transformErrors,
) {
  try {
    validate(schema, formData, ajv);
  } catch (e) {
    console.log(e);
  }

  let errors = transformAjvErrors(ajv.errors);
  ajv.errors = null;

  if (typeof transformErrors === 'function') {
    errors = transformErrors(errors);
  }
  const errorSchema = toErrorSchema(errors);

  if (typeof customValidate !== 'function') {
    return { errors, errorSchema };
  }

  const errorHandler = customValidate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  const newErrors = toErrorList(newErrorSchema);

  return { errors: newErrors, errorSchema: newErrorSchema };
}

export function isValid(schema, data) {
  try {
    return validate(schema, data, ajv);
  } catch (e) {
    return false;
  }
}
