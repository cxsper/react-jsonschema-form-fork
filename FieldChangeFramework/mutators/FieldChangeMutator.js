import _ from 'lodash';
import onChange from 'on-change';
import FieldChangeShowMutator from './FieldChangeShowMutator';
import FieldChangeRequiredMutator from './FieldChangeRequiredMutator';

export default class FieldChangeMutator {
  constructor(framework) {
    this.framework = framework;

    this.showMutator = new FieldChangeShowMutator(framework);
    this.requiredMutator = new FieldChangeRequiredMutator(framework);
  }

  createFormDataPath() {
    this.framework.formDataPath = this.framework.name
      .replace(/root_/, '')
      .replace(/_/g, '.');
  }

  createFormDataContext() {
    const formDataContext = this.framework.formDataPath.split('.');
    formDataContext.splice(-1, 1);

    this.framework.formDataContext = formDataContext.join('.');
  }

  // Gets array indexes from form path
  createFormDataIndexes() {
    this.framework.formDataContextIndexes = this.framework.formDataContext.match(
      /\d+/g,
    );
  }

  // Mutates framework.row to ensure field change
  ensureUpdate() {
    const { formDataPath, value } = this.framework;
    _.set(this.framework.row, formDataPath, value);
  }

  createConditionalFieldList() {
    this.framework.conditionalFields = _.cloneDeep(
      this.framework.props.conditionalSchema.properties,
    );
  }

  createConditionalRequiredFieldList() {
    this.framework.conditionalRequiredFields = this.framework.props.conditionalRequiredFields;
  }

  createReturnableSchema() {
    this.framework.returnableSchema = onChange(
      _.cloneDeep(this.framework.state.schema),
      () => {},
    );
  }
}
