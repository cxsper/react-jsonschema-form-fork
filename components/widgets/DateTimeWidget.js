import React from 'react';
import PropTypes from 'prop-types';

function DateTimeWidget(props) {
  const {
    registry: {
      widgets: { DateWidget },
    },
  } = props;

  return <DateWidget {...props} showTimeSelect />;
}

DateTimeWidget.propTypes = {
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default DateTimeWidget;
