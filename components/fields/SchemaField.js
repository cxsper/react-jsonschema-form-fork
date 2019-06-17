import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '../IconButton';
import * as types from '../../types';
import {
  isMultiSelect,
  isSelect,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
  mergeObjects,
  getUiOptions,
  isFilesArray,
  getSchemaType,
  ADDITIONAL_PROPERTY_FLAG,
} from '../../utils';
import UnsupportedField from './UnsupportedField';

const REQUIRED_FIELD_SYMBOL = '*';
const COMPONENT_TYPES = {
  array: 'ArrayField',
  boolean: 'BooleanField',
  integer: 'NumberField',
  number: 'NumberField',
  object: 'ObjectField',
  string: 'StringField',
};

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  const field = uiSchema['ui:field'];
  if (typeof field === 'function') {
    return field;
  }
  if (typeof field === 'string' && field in fields) {
    return fields[field];
  }

  const componentName = COMPONENT_TYPES[getSchemaType(schema)];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  const isComponentPresent = componentName in fields;
  const returnUnsupportedField = () => (
    <UnsupportedField
      schema={schema}
      idSchema={idSchema}
      reason={`Unknown field type ${schema.type}`}
    />
  );

  return isComponentPresent ? fields[componentName] : returnUnsupportedField;
}

function Label(props) {
  const { label, required, id } = props;
  if (!label) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  return (
    <label className="control-label" htmlFor={id}>
      {label}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}

Label.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
};

function LabelInput(props) {
  const { id, label, onChange } = props;
  return (
    <input
      className="form-control"
      type="text"
      id={id}
      onBlur={event => onChange(event.target.value)}
      defaultValue={label}
    />
  );
}

LabelInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func,
};

function Help(props) {
  const { help } = props;

  if (!help) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  if (typeof help === 'string') {
    return <p className="help-block">{help}</p>;
  }

  if (typeof help === 'object') {
    const { key, ref, props } = help; // eslint-disable-line

    const HelpComponent = help.type;

    return (
      <div className="help-block">
        <HelpComponent key={key} ref={ref} props={props} />
      </div>
    );
  }

  return <div className="help-block">{help}</div>;
}

Help.propTypes = {
  help: PropTypes.any,
};

function ErrorList(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return <div />;
  }
  return (
    <div>
      <p />
      <ul className="error-detail bs-callout bs-callout-info">
        {errors.map((error, index) => (
          /* eslint-disable react/no-array-index-key */
          <li className="text-danger" key={index}>
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

ErrorList.propTypes = {
  errors: PropTypes.array,
};

function DefaultTemplate(props) {
  const {
    id,
    classNames,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
    onKeyChange,
    onDropPropertyClick,
  } = props;
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  const additional = Object.prototype.hasOwnProperty.call(
    props.schema,
    ADDITIONAL_PROPERTY_FLAG,
  );
  const keyLabel = `${label} Key`;

  return (
    <div className={classNames}>
      <div className={additional ? 'row' : ''}>
        {additional && (
          <div className="col-xs-5 form-additional">
            <div className="form-group">
              <Label label={keyLabel} required={required} id={`${id}-key`} />
              <LabelInput
                label={label}
                required={required}
                id={`${id}-key`}
                onChange={onKeyChange}
              />
            </div>
          </div>
        )}

        <div
          className={additional ? 'form-additional form-group col-xs-5' : ''}
        >
          {displayLabel && <Label label={label} required={required} id={id} />}
          {displayLabel && description ? description : null}
          {children}
          {errors}
          {help}
        </div>
        {additional && (
          <div className="col-xs-2">
            <IconButton
              type="danger"
              icon="remove"
              className="array-item-remove btn-block"
              tabIndex="-1"
              style={{ border: '0' }}
              disabled={props.disabled || props.readonly}
              onClick={onDropPropertyClick(props.label)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* eslint-disable react/no-unused-prop-types */
DefaultTemplate.propTypes = {
  id: PropTypes.string,
  classNames: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  errors: PropTypes.element,
  rawErrors: PropTypes.arrayOf(PropTypes.string),
  help: PropTypes.element,
  rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  description: PropTypes.element,
  rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  hidden: PropTypes.bool,
  required: PropTypes.bool,
  readonly: PropTypes.bool,
  displayLabel: PropTypes.bool,
  fields: PropTypes.object,
  formContext: PropTypes.object,
  disabled: PropTypes.bool,
  schema: PropTypes.object,
  onKeyChange: PropTypes.func,
  onDropPropertyClick: PropTypes.func,
};

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

function SchemaFieldRender(props) {
  const {
    uiSchema,
    formData,
    errorSchema,
    idPrefix,
    name,
    onKeyChange,
    onDropPropertyClick,
    required,
    registry = getDefaultRegistry(),
  } = props;
  const {
    definitions,
    fields,
    formContext,
    FieldTemplate = DefaultTemplate,
  } = registry;
  let { idSchema } = props;
  const schema = retrieveSchema(props.schema, definitions, formData);
  idSchema = mergeObjects(
    toIdSchema(schema, null, definitions, formData, idPrefix),
    idSchema,
  );
  const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  const { DescriptionField } = fields;
  const disabled = Boolean(props.disabled || uiSchema['ui:disabled']);
  const readonly = Boolean(props.readonly || uiSchema['ui:readonly']);
  const autofocus = Boolean(props.autofocus || uiSchema['ui:autofocus']);

  if (Object.keys(schema).length === 0) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }

  const uiOptions = getUiOptions(uiSchema);
  let { label: displayLabel = true } = uiOptions;
  if (schema.type === 'array') {
    displayLabel =
      isMultiSelect(schema, definitions) ||
      isFilesArray(schema, uiSchema, definitions);
  }
  if (schema.type === 'object') {
    displayLabel = false;
  }
  if (schema.type === 'boolean' && !uiSchema['ui:widget']) {
    displayLabel = false;
  }
  if (uiSchema['ui:field']) {
    displayLabel = false;
  }

  let { __errors, ...fieldErrorSchema } = errorSchema; // eslint-disable-line

  /* Handle errors for arrays */
  if (errorSchema[0]) {
    __errors = errorSchema[0].__errors; // eslint-disable-line
  }

  const handleChange = (data, errors) => {
    const changedFieldId = props.idSchema.$id;

    props.onChange(data, errors);

    if (changedFieldId) {
      props.registry.formContext.onFieldChange(changedFieldId, data);
    }
  };

  const field = (
    <FieldComponent
      {...props}
      idSchema={idSchema}
      schema={schema}
      uiSchema={{ ...uiSchema, classNames: undefined }}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      rawErrors={__errors}
      onChange={handleChange}
    />
  );

  const { type } = schema;
  const id = idSchema.$id;
  const label =
    uiSchema['ui:title'] || props.schema.title || schema.title || name;
  const description = uiSchema['ui:description'];
  const errors = __errors;
  const help = uiSchema['ui:help'];
  let hidden = uiSchema['ui:widget'] === 'hidden';

  if (schema.fieldInfo) {
    const { read } = schema.fieldInfo;
    if (!read) {
      hidden = true;
    }
  }

  const classNames = [
    'form-group',
    'field',
    `field-${type}`,
    errors && errors.length > 0 ? 'field-error has-error has-danger' : '',
    uiSchema.classNames,
    schema.formWidth ? `col-sm-${schema.formWidth}` : 'col-sm-12',
  ]
    .join(' ')
    .trim();

  const fieldProps = {
    description: (
      <DescriptionField
        id={`${id}__description`}
        description={description}
        formContext={formContext}
      />
    ),
    rawDescription: description,
    help: <Help help={help} />,
    rawHelp: typeof help === 'string' ? help : undefined,
    errors: <ErrorList errors={errors} />,
    rawErrors: errors,
    id,
    label,
    hidden,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled,
    readonly,
    displayLabel,
    classNames,
    formContext,
    fields,
    schema,
    uiSchema,
  };

  /* eslint-disable no-underscore-dangle */
  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;

  const isOneOf = schema.oneOf && !isSelect(schema);
  const isAnyOf = schema.anyOf && !isSelect(schema);

  return (
    <FieldTemplate {...fieldProps}>
      {field}

      {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
      {isAnyOf && (
        /* eslint-disable react/jsx-pascal-case */
        <_AnyOfField
          disabled={disabled}
          errorSchema={errorSchema}
          formData={formData}
          idPrefix={idPrefix}
          idSchema={idSchema}
          onBlur={props.onBlur}
          onChange={handleChange}
          onFocus={props.onFocus}
          options={schema.anyOf}
          baseType={schema.type}
          registry={registry}
          safeRenderCompletion={props.safeRenderCompletion}
          uiSchema={uiSchema}
        />
      )}

      {isOneOf && (
        <_OneOfField
          disabled={disabled}
          errorSchema={errorSchema}
          formData={formData}
          idPrefix={idPrefix}
          idSchema={idSchema}
          onBlur={props.onBlur}
          onChange={handleChange}
          onFocus={props.onFocus}
          options={schema.oneOf}
          baseType={schema.type}
          registry={registry}
          safeRenderCompletion={props.safeRenderCompletion}
          uiSchema={uiSchema}
        />
      )}
    </FieldTemplate>
  );
}

/**
 * Entry point for any field type
 */
class SchemaField extends React.Component {
  render() {
    return SchemaFieldRender(this.props);
  }
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
};

/* eslint-disable react/no-unused-prop-types */
SchemaField.propTypes = {
  schema: PropTypes.object.isRequired,
  uiSchema: PropTypes.object,
  idSchema: PropTypes.object,
  formData: PropTypes.any,
  errorSchema: PropTypes.object,
  registry: types.registry.isRequired,
};

export default SchemaField;
