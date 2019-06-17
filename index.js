import React from 'react';
import PropTypes from 'prop-types';
import Form from './components/Form';
import { adaptSchema } from './schemaAdapter';

/**
 * This is basically a slightly modified react-jsonschema-form component by Mozilla but with FieldChangeFramework
 * and additional field widgets
 *
 * https://github.com/mozilla-services/react-jsonschema-form
 */

/**
 * Form HOC to pass the ref
 */
const FormHOC = React.forwardRef((props, ref) => {
  const adaptedSchema = adaptSchema(props.model);
  return <Form {...adaptedSchema} {...props} ref={ref} />;
});

FormHOC.propTypes = {
  model: PropTypes.object.isRequired,
};

export default FormHOC;
