import React from 'react';
import bindThisToFunctions from 'utils/bindThisToFunctions';
import PropTypes from 'prop-types';
import { WithContext as ReactTags } from 'react-tag-input';

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

/* eslint-disable react/prefer-stateless-function, no-underscore-dangle */
class TagsWidget extends React.Component {
  constructor(props) {
    super(props);

    bindThisToFunctions(
      this,
      this.handleDelete,
      this.handleAddition,
      this.handleDrag,
      this._mapTagsToArray,
      this._mapArrayToTags,
    );

    const { value } = props;

    this.state = {
      tags: value.length ? this._mapArrayToTags() : [],
    };
  }

  _mapTagsToArray() {
    return this.state.tags.map(tag => tag.text);
  }

  _mapArrayToTags() {
    return this.props.value.map(text => ({
      id: text,
      text,
    }));
  }

  handleDelete(i) {
    const { tags } = this.state;

    this.setState(
      {
        tags: tags.filter((tag, index) => index !== i),
      },
      () => {
        this.props.onChange(this._mapTagsToArray());
      },
    );
  }

  handleAddition(tag) {
    this.setState(
      state => ({
        tags: [...state.tags, tag],
      }),
      () => {
        this.props.onChange(this._mapTagsToArray());
      },
    );
  }

  handleDrag(tag, currPos, newPos) {
    const tags = [...this.state.tags];
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    this.setState({ tags: newTags }, () => {
      this.props.onChange(this._mapTagsToArray());
    });
  }

  render() {
    const { tags } = this.state;

    const {
      schema: { title, parameters },
      id,
    } = this.props;

    const options = parameters && parameters.options ? parameters.options : {};

    return (
      <div className="form-group">
        <label htmlFor={id} className="control-label">
          {title}
        </label>
        <ReactTags
          tags={tags}
          classNames={{
            tagInputField: 'ReactTags__tagInputField form-control',
          }}
          handleDelete={this.handleDelete}
          handleAddition={this.handleAddition}
          handleDrag={this.handleDrag}
          delimiters={delimiters}
          {...options}
          autofocus={false}
        />
      </div>
    );
  }
}

TagsWidget.propTypes = {
  value: PropTypes.array.isRequired,
  schema: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default TagsWidget;
