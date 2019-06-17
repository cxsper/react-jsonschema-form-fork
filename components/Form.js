import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import bindThisToFunctions from 'utils/bindThisToFunctions';
import stubInterpolatedProperties from 'utils/stubInterpolatedProperties';
import FieldChangeFramework from '../FieldChangeFramework';
import DefaultErrorList from './ErrorList';
/* eslint-disable no-unused-vars */
import {
  getDefaultFormState,
  retrieveSchema,
  toIdSchema,
  setState,
  getDefaultRegistry,
  deepEquals,
} from '../utils';
import validateFormData, { toErrorList } from '../validate';

import './Form.scss';

/* eslint-disable react/jsx-pascal-case */
export default class Form extends Component {
  static defaultProps = {
    noValidate: false,
    liveValidate: false,
    disabled: false,
    safeRenderCompletion: false,
    noHtml5Validate: false,
    ErrorList: DefaultErrorList,
  };

  /**
   * Consctruct form data schema from data
   * @param formData
   * @param keyPrefix
   */
  constructSchemaFromData(formData, keyPrefix = 'root') {
    _.forOwn(formData, (value, key) => {
      const fieldName = `${keyPrefix}_${key}`;
      if (typeof value === 'object') {
        if (!value.hash && !value.size && !value.type) {
          return this.constructSchemaFromData(value, fieldName);
        }
      }
      return this.onFieldChange(fieldName, value);
    });
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
    if (
      this.props.onChange &&
      !deepEquals(this.state.formData, this.props.formData)
    ) {
      this.props.onChange(this.state);
    }
    this.formElement = null;
    bindThisToFunctions(
      this,
      this.onFieldChange,
      this.addArrayItemToSchema,
      this.removeArrayItemFromSchema,
      this.reorderArrayItemsInSchema,
      this.constructSchemaFromData,
      this.stubInterpolatedFormProperties,
    );
  }

  componentDidMount() {
    this.constructSchemaFromData(this.props.formData);
  }

  getStateFromProps(props) {
    const state = this.state || {};
    const schema = 'schema' in props ? props.schema : this.props.schema;
    const uiSchema = 'uiSchema' in props ? props.uiSchema : this.props.uiSchema;
    const edit = typeof props.formData !== 'undefined';
    const liveValidate = props.liveValidate || this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const { definitions } = schema;

    const formData = getDefaultFormState(schema, props.formData, definitions);
    const retrievedSchema = retrieveSchema(schema, definitions, formData);
    const { conditionalRequiredFields } = props;

    let errors = state.errors || [];
    let errorSchema = state.errorSchema || {};

    if (mustValidate) {
      const validation = this.validate(formData, schema);
      errors = validation.errors; // eslint-disable-line
      errorSchema = validation.errorSchema; // eslint-disable-line
    }

    const idSchema = toIdSchema(
      retrievedSchema,
      uiSchema['ui:rootFieldId'],
      definitions,
      formData,
      props.idPrefix,
    );
    return {
      schema,
      uiSchema,
      idSchema,
      formData,
      edit,
      errors,
      errorSchema,
      conditionalRequiredFields,
    };
  }

  validate(formData, schema = this.props.schema) {
    const { validate, transformErrors } = this.props;
    const { definitions } = this.getRegistry();
    const resolvedSchema = retrieveSchema(schema, definitions, formData);
    return validateFormData(
      formData,
      resolvedSchema,
      validate,
      transformErrors,
    );
  }

  renderErrors() {
    const { errors, errorSchema, schema, uiSchema } = this.state;
    const { ErrorList, showErrorList, formContext } = this.props;

    if (errors.length && showErrorList !== false) {
      return (
        <ErrorList
          errors={errors}
          errorSchema={errorSchema}
          schema={schema}
          uiSchema={uiSchema}
          formContext={formContext}
        />
      );
    }
    return null;
  }

  stubInterpolatedFormProperties(url) {
    return stubInterpolatedProperties({
      target: url,
      object: this.state.formData,
    });
  }

  reorderArrayItemsInSchema(arraySchema, id, oldIndex, newIndex) {
    let { schemaPath } = arraySchema;
    const formDataIndexes = id.match(/\d+/g);

    if (formDataIndexes) {
      formDataIndexes.forEach(formDataIndex => {
        schemaPath = schemaPath.replace('INDEX', formDataIndex);
      });
    }

    schemaPath += `.items`;

    this.setState({}, () => {
      this.setState(state => {
        const { schema } = _.cloneDeep(state);
        const array = _.cloneDeep(_.get(schema.properties, schemaPath));
        const newArray = array.slice();
        newArray.splice(oldIndex, 1);
        newArray.splice(newIndex, 0, array[oldIndex]);
        _.set(schema.properties, schemaPath, newArray);
        return {
          schema,
        };
      });
    });
  }

  removeArrayItemFromSchema(arraySchema, id, index) {
    let { schemaPath } = arraySchema;
    const formDataIndexes = id.match(/\d+/g);

    if (formDataIndexes) {
      formDataIndexes.forEach(formDataIndex => {
        schemaPath = schemaPath.replace('INDEX', formDataIndex);
      });
    }

    schemaPath += `.items`;

    this.setState({}, () => {
      this.setState(state => {
        const { schema } = _.cloneDeep(state);
        const array = _.cloneDeep(_.get(schema.properties, schemaPath));
        array.splice(index, 1);
        _.set(schema.properties, schemaPath, array);
        return {
          schema,
        };
      });
    });
  }

  addArrayItemToSchema(arraySchema, id) {
    let { schemaPath } = arraySchema;
    const formDataIndexes = id.match(/\d+/g);

    if (formDataIndexes) {
      formDataIndexes.forEach(formDataIndex => {
        schemaPath = schemaPath.replace('INDEX', formDataIndex);
      });
    }

    schemaPath += `.items.${arraySchema.items.length}`;

    this.setState({}, () => {
      this.setState(state => {
        const schema = _.cloneDeep(state.schema);
        _.set(schema.properties, schemaPath, arraySchema.additionalItems);
        return { schema };
      });
    });
  }

  /**
   * Handles form field change to attach custom observers
   * @param name of a field
   * @param value of a field
   */
  onFieldChange = (name, value) => {
    const fieldChangeFramework = new FieldChangeFramework(
      name,
      value,
      this.state,
      this.props,
    );

    if (fieldChangeFramework.isCalledForGlobalFormContext) {
      return;
    }

    /* Evaluate show & required expressions */
    fieldChangeFramework.observeShowChanges();
    fieldChangeFramework.observeRequiredChanges();

    /* Show/hide, require/unrequire fields */
    this.setState(() => ({
      schema: fieldChangeFramework.returnableSchema,
      formData: fieldChangeFramework.row,
    }));
  };

  /**
   * Handles field onChange from inside of a field to set it to a form data
   * @param formData
   * @param newErrorSchema
   */
  onChange = (formData, newErrorSchema) => {
    const mustValidate = !this.props.noValidate && this.props.liveValidate;
    let state = { formData };
    if (mustValidate) {
      const { errors, errorSchema } = this.validate(formData);
      state = { ...state, errors, errorSchema };
    } else if (!this.props.noValidate && newErrorSchema) {
      state = {
        ...state,
        errorSchema: newErrorSchema,
        errors: toErrorList(newErrorSchema),
      };
    }
    setState(this, state, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  onBlur = (...args) => {
    if (this.props.onBlur) {
      this.props.onBlur(...args);
    }
  };

  onFocus = (...args) => {
    if (this.props.onFocus) {
      this.props.onFocus(...args);
    }
  };

  onSubmit = event => {
    if (event) {
      event.preventDefault();
      event.persist();
    }

    if (!this.props.noValidate) {
      const { errors, errorSchema } = this.validate(this.state.formData);
      if (Object.keys(errors).length > 0) {
        setState(this, { errors, errorSchema }, () => {
          if (this.props.onError) {
            this.props.onError(errors);
          } else {
            console.error('Form validation failed', errors);
          }
        });
        return;
      }
    }

    this.setState({ errors: [], errorSchema: {} }, () => {
      if (this.props.onSubmit) {
        this.props.onSubmit({ ...this.state, status: 'submitted' }, event);
      }
    });
  };

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const { fields, widgets } = getDefaultRegistry();
    return {
      fields: { ...fields, ...this.props.fields },
      widgets: { ...widgets, ...this.props.widgets },
      ArrayFieldTemplate: this.props.ArrayFieldTemplate,
      ObjectFieldTemplate: this.props.ObjectFieldTemplate,
      FieldTemplate: this.props.FieldTemplate,
      definitions: this.props.schema.definitions || {},
      formContext: {
        ...this.props.formContext,
        onFieldChange: this.onFieldChange,
        addArrayItemToSchema: this.addArrayItemToSchema,
        removeArrayItemFromSchema: this.removeArrayItemFromSchema,
        reorderArrayItemsInSchema: this.reorderArrayItemsInSchema,
        stubInterpolatedFormProperties: this.stubInterpolatedFormProperties,
      },
    };
  }

  submit() {
    if (this.formElement) {
      this.formElement.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  render() {
    const {
      children,
      safeRenderCompletion,
      id,
      idPrefix,
      className,
      name,
      method,
      target,
      action,
      autocomplete,
      enctype,
      acceptcharset,
      noHtml5Validate,
      disabled,
      submittedExternally,
    } = this.props;

    const { schema, uiSchema, formData, errorSchema, idSchema } = this.state;
    const registry = this.getRegistry();
    /* eslint-disable no-underscore-dangle */
    const _SchemaField = registry.fields.SchemaField;

    const submitButton = (
      <button
        type="submit"
        onClick={this.onSubmit}
        className={`btn btn-info ${submittedExternally && 'hidden'}`}
      >
        Submit
      </button>
    );

    return (
      <form
        className={`${className || 'rjsf'} clearfix`}
        id={id}
        name={name}
        method={method}
        target={target}
        action={action}
        autoComplete={autocomplete}
        encType={enctype}
        acceptCharset={acceptcharset}
        noValidate={noHtml5Validate}
        onSubmit={this.onSubmit}
        ref={form => {
          this.formElement = form;
        }}
      >
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          idPrefix={idPrefix}
          formData={formData}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          registry={registry}
          safeRenderCompletion={safeRenderCompletion}
          disabled={disabled}
        />
        {children}
        {submitButton}
      </form>
    );
  }
}

/* eslint-disable react/no-unused-prop-types */
Form.propTypes = {
  schema: PropTypes.object.isRequired,
  uiSchema: PropTypes.object.isRequired,
  conditionalSchema: PropTypes.object.isRequired,
  conditionalRequiredFields: PropTypes.object.isRequired,
  formData: PropTypes.any.isRequired,
  widgets: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  ),
  fields: PropTypes.objectOf(PropTypes.func),
  ArrayFieldTemplate: PropTypes.func,
  ObjectFieldTemplate: PropTypes.func,
  FieldTemplate: PropTypes.func,
  ErrorList: PropTypes.func,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  showErrorList: PropTypes.bool,
  onSubmit: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  id: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
  method: PropTypes.string,
  target: PropTypes.string,
  action: PropTypes.string,
  autocomplete: PropTypes.string,
  enctype: PropTypes.string,
  acceptcharset: PropTypes.string,
  noValidate: PropTypes.bool,
  noHtml5Validate: PropTypes.bool,
  liveValidate: PropTypes.bool,
  validate: PropTypes.func,
  transformErrors: PropTypes.func,
  safeRenderCompletion: PropTypes.bool,
  formContext: PropTypes.object,
  disabled: PropTypes.bool,
  children: PropTypes.any,
  idPrefix: PropTypes.any,
  submittedExternally: PropTypes.bool,
};
