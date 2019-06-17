import _ from 'lodash';
import { store } from '../../../../app';

export default class FieldChangeRequiredMutator {
  constructor(framework) {
    this.framework = framework;

    this.action = store.getState().toJS().actions.action;
  }

  setFieldName() {
    const { conditionalRequiredFieldName } = this.framework;
    this.framework.fieldName = conditionalRequiredFieldName.slice(
      conditionalRequiredFieldName.lastIndexOf('_') + 1,
    );
  }

  setConditionalRequiredField() {
    const {
      conditionalRequiredFields,
      conditionalRequiredFieldName,
    } = this.framework;
    const conditionalRequiredField =
      conditionalRequiredFields[conditionalRequiredFieldName];
    this.framework.schemaContext = conditionalRequiredField.schemaContext;
    this.framework.fieldFormContext = conditionalRequiredField.formContext;
    this.framework.conditionalRequiredField = conditionalRequiredField;
  }

  setFieldSchemaPath() {
    const {
      conditionalRequiredFieldName,
      formDataContextIndexes,
    } = this.framework;

    let { schemaContext, fieldFormContext } = this.framework;

    let fieldSchemaPath = conditionalRequiredFieldName.replace(/_/g, '.');

    if (formDataContextIndexes) {
      formDataContextIndexes.forEach(formDataContextIndex => {
        schemaContext = schemaContext.replace('INDEX', formDataContextIndex);
        fieldFormContext = fieldFormContext.replace(
          'INDEX',
          formDataContextIndex,
        );
        fieldSchemaPath = fieldSchemaPath.replace(
          'INDEX',
          formDataContextIndex,
        );
      });
    }

    this.framework.fieldSchemaPath = fieldSchemaPath;
    this.framework.schemaContext = schemaContext;
    this.framework.fieldFormContext = fieldFormContext;
  }

  setSchemaContext() {
    const { schemaContext } = this.framework;

    if (schemaContext.length !== 0) {
      this.framework.schemaContext = `properties.${schemaContext}.`;
    }

    this.framework.schemaContext += 'required';
  }

  setData() {
    const { fieldFormContext, formDataContext, row } = this.framework;
    let data = {};

    if (fieldFormContext === formDataContext) {
      if (formDataContext === '') {
        data = row;
      } else {
        data = _.get(row, formDataContext, undefined);
      }
    } else {
      data = undefined;
    }

    this.framework.data = data;
  }

  setExpression() {
    const {
      data,
      row,
      conditionalRequiredField: { required },
    } = this.framework;

    /* eslint-disable no-new-func */
    this.framework.requiredExpression = new Function(
      'data',
      'row',
      'action',
      `return ${required}`,
    ).bind({
      data,
      row,
      action: this.action,
    });
  }

  setRequiredArray() {
    const { returnableSchema, schemaContext } = this.framework;
    this.framework.requiredArray = _.get(returnableSchema, schemaContext);
  }

  setRequiredToReturnableSchema() {
    const { schemaContext, requiredArray, fieldName } = this.framework;
    _.set(this.framework.returnableSchema, schemaContext, [
      ...requiredArray,
      fieldName,
    ]);
  }

  unsetRequiredFromReturnableSchema() {
    const { fieldName, schemaContext, requiredArray } = this.framework;

    const array = requiredArray.filter(
      requiredFieldName => requiredFieldName !== fieldName,
    );
    _.set(this.framework.returnableSchema, schemaContext, [...array]);
  }
}
