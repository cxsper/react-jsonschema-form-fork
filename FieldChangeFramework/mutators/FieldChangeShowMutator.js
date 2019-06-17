import _ from 'lodash';
import { store } from '../../../../app';

export default class FieldChangeShowMutator {
  constructor(framework) {
    this.framework = framework;

    this.action = store.getState().toJS().actions.action;
  }

  setConditionalField() {
    const { conditionalFields, conditionalFieldName } = this.framework;
    this.framework.conditionalField = _.cloneDeep(
      conditionalFields[conditionalFieldName],
    );
  }

  setConditionalFieldPath() {
    this.framework.conditionalFieldPath = this.framework.conditionalFieldName.replace(
      /_/g,
      '.',
    );
  }

  setFieldContextPath() {
    const {
      formDataContextIndexes,
      conditionalField,
      conditionalFieldPath,
    } = this.framework;
    let fieldContextPath = conditionalField.contextPath;

    // Insert actual form indexes to paths
    if (formDataContextIndexes) {
      formDataContextIndexes.forEach(formDataContextIndex => {
        this.framework.conditionalFieldPath = conditionalFieldPath.replace(
          'INDEX',
          formDataContextIndex,
        );
        fieldContextPath = fieldContextPath.replace(
          'INDEX',
          formDataContextIndex,
        );
      });
    }

    this.framework.fieldContextPath = fieldContextPath;
  }

  setFieldPath() {
    const {
      fieldContextPath,
      conditionalField: { fieldName },
    } = this.framework;

    this.framework.fieldPath =
      fieldContextPath === '' ? fieldName : `${fieldContextPath}.${fieldName}`;
  }

  setData() {
    const { fieldContextPath, formDataContext, row } = this.framework;
    let data = {};

    if (fieldContextPath === formDataContext) {
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

  setFieldToReturnableSchema() {
    const { conditionalFieldPath, conditionalField } = this.framework;

    _.set(
      this.framework.returnableSchema.properties,
      conditionalFieldPath,
      conditionalField,
    );
  }

  unsetFieldFromReturnableSchema() {
    _.unset(
      this.framework.returnableSchema.properties,
      this.framework.conditionalFieldPath,
    );
  }

  unsetFieldFromFormData() {
    _.unset(this.framework.row, this.framework.fieldPath);
  }

  setExpression() {
    const {
      data,
      row,
      conditionalField: { show },
    } = this.framework;

    /* eslint-disable no-new-func */
    this.framework.showExpression = new Function(
      'data',
      'row',
      'action',
      `return ${show}`,
    ).bind({
      data,
      row,
      action: this.action,
    });
  }
}
