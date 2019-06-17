import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

function ListSelect(props) {
  if (!props.id) {
    console.log('No id for', props);
    throw new Error(`no id for props ${JSON.stringify(props)}`);
  }
  const { value, id, onChange, onBlur, schema } = props;

  /* eslint-disable no-underscore-dangle, no-shadow */
  const _onChange = ({ value }) => onChange(value);
  const { list } = schema;

  let selectedOption = {};

  const options = Object.keys(list).map(listItemValue => {
    const option = {
      value: listItemValue,
      label: list[listItemValue],
    };

    if (value === listItemValue) {
      selectedOption = option;
    }

    return option;
  });

  return (
    <Select
      id={id}
      onChange={_onChange}
      onBlur={onBlur}
      options={options}
      value={selectedOption}
    />
  );
}

/* eslint-disable react/no-unused-prop-types */
ListSelect.propTypes = {
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  autofocus: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  schema: PropTypes.object,
};

export default ListSelect;
