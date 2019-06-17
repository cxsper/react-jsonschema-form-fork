import React from 'react';
import AsyncPaginate from 'react-select-async-paginate';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import request from 'utils/request';
import bindThisToFunctions from 'utils/bindThisToFunctions';
import { applicationErrored } from 'containers/App/actions';
import { makeSelectSchema } from 'containers/App/selectors';

/* eslint-disable react/prefer-stateless-function */
class LookupSelect extends React.Component {
  constructor(props) {
    super(props);

    const { table } = props.schema.lookup;

    this.state = {
      isMultiSource: Object.keys(table).length > 1,
    };

    const models = props.globalSchema.get('models').toJS();

    if (this.state.isMultiSource) {
      this.state.sources = Object.keys(table).map(tableName => ({
        value: tableName,
        label: models[tableName].fullName,
      }));
    } else {
      this.state.source = {
        value: Object.keys(table)[0],
        label: models[Object.keys(table)[0]].fullName,
      };
    }

    if (props.value) {
      if (props.value.table) {
        this.state.source = {
          value: props.value.table,
          label: models[props.value.table].fullName,
        };
      }
      if (props.value[0] && props.value[0].table) {
        this.state.source = {
          value: props.value[0].table,
          label: models[props.value[0].table].fullName,
        };
      }
    }

    bindThisToFunctions(
      this,
      this.loadOptions,
      this.handleChange,
      this.handleSourceChange,
      this.handleBlur,
    );
  }

  render() {
    const sourcesSelect = this.state.sources && (
      <Select
        value={this.state.source}
        onChange={this.handleSourceChange}
        placeholder="Select collection..."
        options={this.state.sources}
      />
    );

    const asyncSelect = this.state.source && (
      <AsyncPaginate
        debounceTimeout={200}
        id={this.props.id}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        loadOptions={this.loadOptions()}
        value={this.props.value}
        additional={{ page: 1 }}
        cacheUniq={this.state.source}
        isMulti={this.props.isMulti}
      />
    );

    return (
      <div>
        <div className="form-group">{sourcesSelect}</div>
        <div className="form-group">{asyncSelect}</div>
      </div>
    );
  }

  handleChange(obj) {
    this.props.onChange(obj);
  }

  handleSourceChange(source) {
    this.setState({ source });
    this.props.onChange({});
  }

  handleBlur() {
    this.props.onBlur(this.props.id, true);
  }

  loadOptions() {
    return async (search, loadedOptions, { page }) => {
      const { id } = this.props.schema.lookup;
      const tableName = this.state.source.value;
      const requestURL = `lookups/${id}/${tableName}?q=${search}&page=${page}`;

      const respond = await request(requestURL);

      try {
        const options = respond.data.map(o => ({
          value: o.id,
          table: tableName,
          _id: o.id,
          label: o.label,
        }));

        const hasMore = respond.more;

        return {
          options,
          hasMore,
          additional: {
            page: page + 1,
          },
        };
      } catch (err) {
        this.props.onLookupFailed(err);
      }

      return {};
    };
  }
}

LookupSelect.propTypes = {
  id: PropTypes.string.isRequired,
  onBlur: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onLookupFailed: PropTypes.func.isRequired,
  globalSchema: PropTypes.object.isRequired,
  isMulti: PropTypes.bool,
  value: PropTypes.any,
};

const mapStateToProps = createStructuredSelector({
  globalSchema: makeSelectSchema(),
});

function mapDispatchToProps(dispatch) {
  return {
    onLookupFailed: message => dispatch(applicationErrored(message)),
    dispatch,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LookupSelect);
