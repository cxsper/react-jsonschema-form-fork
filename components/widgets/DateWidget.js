import React from 'react';
import DateTimePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PropTypes from 'prop-types';
import { pad } from '../../utils';

export function utcToLocal(jsonDate, showTime = false) {
  if (!jsonDate) {
    return '';
  }
  const date = new Date(jsonDate);

  const yyyy = pad(date.getFullYear(), 4);
  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  if (showTime) {
    return new Date(`${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`);
  }

  return new Date(`${yyyy}-${MM}-${dd}`);
}

export function localToUTC(dateString, showTimeSelect = false) {
  let date = new Date().toISOString();

  if (dateString) {
    date = new Date(dateString).toISOString();
  }

  if (!showTimeSelect) {
    return date.split('T')[0];
  }

  return `${date.split('Z')[0]}Z`;
}

function DateWidget(props) {
  const { value, onChange, showTimeSelect, id, onBlur } = props;

  const selectedDate = value
    ? new Date(utcToLocal(value, showTimeSelect))
    : new Date();

  return (
    <DateTimePicker
      id={id}
      onBlur={onBlur}
      showTimeSelect={showTimeSelect}
      className="form-control"
      dateFormat="MMMM d, yyyy h:mm aa"
      dropdownMode="select"
      autoComplete="off"
      selected={selectedDate}
      onChange={val => {
        onChange(localToUTC(val, showTimeSelect));
      }}
      timeCaption="time"
    />
  );
}

DateWidget.propTypes = {
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  value: PropTypes.string,
  showTimeSelect: PropTypes.bool,
};

export default DateWidget;
