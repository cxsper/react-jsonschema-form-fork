import React from 'react';
import PropTypes from 'prop-types';

/**
 * Unsupported field component
 * @param schema
 * @param idSchema
 * @param reason
 * @returns {Object} unsupported field
 * @constructor
 */
function UnsupportedField({ schema, idSchema, reason }) {
  const showForLabel = idSchema && idSchema.$id;
  return (
    <div className="unsupported-field">
      <p>
        Unsupported field schema
        {showForLabel && (
          <span>
            {' for'} field <code>{idSchema.$id}</code>
          </span>
        )}
        {reason && <em>: {reason}</em>}.
      </p>
      {schema && <pre>{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
}

UnsupportedField.propTypes = {
  schema: PropTypes.object.isRequired,
  idSchema: PropTypes.object,
  reason: PropTypes.string,
};

export default UnsupportedField;
