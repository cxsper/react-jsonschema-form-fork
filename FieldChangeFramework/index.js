import _ from 'lodash';
import FieldChangeService from './services/FieldChangeService';

/* eslint-disable no-underscore-dangle */
/**
 * Class to handle a form field change
 */
export default class FieldChangeFramework {
  constructor(name, value, state, props) {
    this.name = name;
    this.value = value;
    this.state = state;
    this.props = props;
    this.row = _.cloneDeep(state.formData);

    /**
     * Create service for this change
     * @type {FieldChangeService}
     */
    this.service = new FieldChangeService(this);
    const { service } = this;

    /**
     * Determine whether the field is on the top level of a form (not nested)
     */
    if (service.isGlobalContext()) {
      this.isCalledForGlobalFormContext = true;
    }

    service.prepare();
  }

  observeShowChanges() {
    const {
      conditionalFields,
      service: { showService },
    } = this;

    Object.keys(conditionalFields).forEach(conditionalFieldName => {
      this.conditionalFieldName = conditionalFieldName;
      showService.prepare();

      if (showService.isAccessingWrongContext()) {
        return;
      }
      showService.evaluateExpression();
    });
  }

  observeRequiredChanges() {
    const {
      conditionalRequiredFields,
      service: { requiredService },
    } = this;

    Object.keys(conditionalRequiredFields).forEach(
      conditionalRequiredFieldName => {
        this.conditionalRequiredFieldName = conditionalRequiredFieldName;
        requiredService.prepare();

        if (
          requiredService.isFieldDoesntExist() ||
          requiredService.isAccessingWrongContext()
        ) {
          return;
        }
        requiredService.evaluateExpression();
      },
    );
  }
}
