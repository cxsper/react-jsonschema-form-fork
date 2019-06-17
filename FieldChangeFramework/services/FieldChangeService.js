import FieldChangeRequiredService from './FieldChangeRequiredService';
import FieldChangeShowService from './FieldChangeShowService';
import FieldChangeMutator from '../mutators/FieldChangeMutator';

/**
 * Field change service to define both required & show changes
 */
export default class FieldChangeService {
  constructor(framework) {
    this.framework = framework;
  }

  isGlobalContext() {
    return this.framework.name === 'root';
  }

  prepare() {
    /* If needed, change the order carefully since this utilizes FieldChangeFramework
     * to mutate it's properties
     */
    this.mutator = new FieldChangeMutator(this.framework);
    const { mutator } = this;

    this.showService = new FieldChangeShowService(this.framework, mutator);
    this.requiredService = new FieldChangeRequiredService(
      this.framework,
      mutator,
    );

    mutator.createFormDataPath();
    mutator.createFormDataContext();
    mutator.createFormDataIndexes();
    mutator.ensureUpdate();
    mutator.createConditionalFieldList();
    mutator.createConditionalRequiredFieldList();
    mutator.createReturnableSchema();
  }
}
