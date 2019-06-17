import React from 'react';
import PropTypes from 'prop-types';

/**
 * Description for any field
 * @param props
 * @returns {Object} description of a field
 * @constructor
 */
function DescriptionField(props) {
  const { id, description } = props;
  if (!description) {
    return <div />;
  }
  if (typeof description === 'string') {
    return (
      <p id={id} className="field-description">
        {description}
      </p>
    );
  }
  return (
    <div id={id} className="field-description">
      {description}
    </div>
  );
}

DescriptionField.propTypes = {
  id: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

export default DescriptionField;
