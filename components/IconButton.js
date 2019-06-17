import React from 'react';
import PropTypes from 'prop-types';

export default function IconButton(props) {
  const { type = 'default', icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}
    >
      <i className={`glyphicon glyphicon-${icon}`} />
    </button>
  );
}

IconButton.propTypes = {
  type: PropTypes.string,
  icon: PropTypes.string,
  className: PropTypes.string,
};
