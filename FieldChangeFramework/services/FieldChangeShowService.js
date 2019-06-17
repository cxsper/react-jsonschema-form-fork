/* eslint-disable no-underscore-dangle, no-unused-vars */
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

export default class FieldChangeShowService {
  constructor(framework, mutator) {
    this.framework = framework;
    this.mutator = mutator;
  }

  prepare() {
    const {
      mutator: { showMutator },
    } = this;
    showMutator.setConditionalField();
    showMutator.setConditionalFieldPath();
    showMutator.setFieldContextPath();
    showMutator.setFieldPath();

    showMutator.setData();
  }

  evaluateExpression() {
    const {
      mutator: { showMutator },
    } = this;
    showMutator.setExpression();
    const { data, row, showExpression } = this.framework;

    try {
      if (showExpression(data, row)) {
        if (this._isConditionalFieldAlreadyShown()) {
          return;
        }
        showMutator.setFieldToReturnableSchema();
      } else {
        if (!this._isConditionalFieldAlreadyShown()) {
          return;
        }
        showMutator.unsetFieldFromReturnableSchema();
        showMutator.unsetFieldFromFormData();
      }
    } catch (e) {
      showMutator.setFieldToReturnableSchema();
      console.log(e);
    }
  }

  isAccessingWrongContext() {
    const {
      conditionalField: { show },
      data,
    } = this.framework;

    if (show && show.includes('data') && data === undefined) {
      return true;
    }
    return false;
  }

  _isConditionalFieldAlreadyShown() {
    return _.get(
      this.framework.returnableSchema.properties,
      this.framework.conditionalFieldPath,
    );
  }
}
