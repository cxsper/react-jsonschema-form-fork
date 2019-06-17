/* eslint-disable no-unused-vars */
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

export default class FieldChangeRequiredService {
  constructor(framework, mutator) {
    this.framework = framework;
    this.mutator = mutator;
  }

  prepare() {
    const {
      mutator: { requiredMutator },
    } = this;
    requiredMutator.setFieldName();
    requiredMutator.setConditionalRequiredField();
    requiredMutator.setFieldSchemaPath();
    requiredMutator.setSchemaContext();

    requiredMutator.setData();
  }

  isAccessingWrongContext() {
    const { conditionalRequiredField, data } = this.framework;
    return (
      conditionalRequiredField.required.includes('data') && data === undefined
    );
  }

  isFieldDoesntExist() {
    const { returnableSchema, fieldSchemaPath } = this.framework;
    return _.get(returnableSchema.properties, fieldSchemaPath);
  }

  evaluateExpression() {
    const {
      mutator: { requiredMutator },
    } = this;

    requiredMutator.setExpression();

    try {
      requiredMutator.setRequiredArray();
      const { data, row } = this.framework;

      if (this.framework.requiredExpression(data, row)) {
        requiredMutator.setRequiredToReturnableSchema();
      } else {
        requiredMutator.unsetRequiredFromReturnableSchema();
      }
    } catch (e) {
      console.log(e);
    }
  }
}
