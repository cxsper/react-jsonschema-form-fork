import React from 'react';
import PropTypes from 'prop-types';

export default function ErrorList(props) {
  const { errors } = props;
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
        <h3 className="panel-title">Errors</h3>
      </div>
      <ul className="list-group">
        {errors.map((error, i) => (
          /* eslint-disable react/no-array-index-key */
          <li key={i} className="list-group-item text-danger">
            {error.stack}
          </li>
        ))}
      </ul>
    </div>
  );
}

ErrorList.propTypes = {
  errors: PropTypes.array,
};
