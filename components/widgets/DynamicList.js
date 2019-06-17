import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { connect } from 'react-redux';
import { applicationErrored } from 'containers/App/actions';
import bindThisToFunctions from 'utils/bindThisToFunctions';
import request from 'utils/request';

/* eslint-disable react/no-unused-state */
/**
 * Dynamic list component
 */
class DynamicList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: [],
      loaded: false,
    };

    bindThisToFunctions(this, this.loadOptions, this.handleChange);

    this.loadOptions();
  }

  handleChange(obj) {
    this.props.onChange(obj.value);
  }

  render() {
    const { props } = this;
    if (!props.id) {
      console.log('No id for', props);
      throw new Error(`no id for props ${JSON.stringify(props)}`);
    }
    const { value, id, onBlur } = props;

    const { options } = this.state;
    const selectedOption = options.find(option => option.value === value) || {};

    return (
      <Select
        id={id}
        onChange={this.handleChange}
        onBlur={onBlur}
        options={options}
        value={selectedOption}
      />
    );
  }

  /**
   * Parse response to get dynamic options
   * @param response to be parsed
   * @returns {Object[]} options
   */
  parseResponse(response) {
    if (!response) return [];
    const { data } = response;
    if (!data || typeof data !== 'object') return [];

    return Object.keys(data).map(value => {
      const label = data[value];
      return {
        value,
        label,
      };
    });
  }

  /**
   * Handles dynamic options loading
   */
  loadOptions() {
    const {
      schema: {
        list: { url, method },
      },
      formContext: { stubInterpolatedFormProperties },
    } = this.props;

    const requestURL = stubInterpolatedFormProperties(url);

    const options = {
      method,
    };
    request(requestURL, options)
      .then(response => {
        this.setState({ options: this.parseResponse(response), loaded: true });
      })
      .catch(e => {
        console.log(e);
      });
  }
}

/* eslint-disable react/no-unused-prop-types */
DynamicList.propTypes = {
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
  onLoadOptionsFailed: PropTypes.func.isRequired,
  formContext: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onLoadOptionsFailed: message => dispatch(applicationErrored(message)),
    dispatch,
  };
}

export default connect(
  null,
  mapDispatchToProps,
)(DynamicList);
