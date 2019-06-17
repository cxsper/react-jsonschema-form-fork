import React from 'react';
import PropTypes from 'prop-types';

const REQUIRED_FIELD_SYMBOL = '*';

/**
 * Title field component
 * @param props
 * @returns {Object} field title representation
 * @constructor
 */
function TitleField(props) {
  const { id, title, required } = props;
  return (
    <div id={id}>
      {title}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </div>
  );
}

TitleField.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  required: PropTypes.bool,
};

export default TitleField;
