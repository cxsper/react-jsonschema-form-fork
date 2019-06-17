import React, { Component } from 'react';
import includes from 'core-js/library/fn/array/includes';
import { Panel } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import AddButton from '../AddButton';
import IconButton from '../IconButton';
import * as types from '../../types';
import UnsupportedField from './UnsupportedField';
import {
  getWidget,
  getDefaultFormState,
  getUiOptions,
  isMultiSelect,
  isFixedItems,
  allowAdditionalItems,
  optionsList,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
} from '../../utils';

/**
 * Array field title component
 * @param TitleField component to display title in
 * @param idSchema
 * @param title to be displayed
 * @param required is required
 * @returns {Object} array field title
 * @constructor
 */
function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
  if (!title) {
    return <div />;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
}

ArrayFieldTitle.propTypes = {
  TitleField: PropTypes.any,
  idSchema: PropTypes.object,
  title: PropTypes.string,
  required: PropTypes.bool,
};

/**
 * Array field description component
 * @param DescriptionField component description to be displayed in
 * @param idSchema
 * @param description to be displayed
 * @returns {Object} description to be displayed
 * @constructor
 */
function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
}

ArrayFieldDescription.propTypes = {
  DescriptionField: PropTypes.any,
  idSchema: PropTypes.object,
  description: PropTypes.string,
};

// Used in the two templates
/**
 * Array item component
 * @param props
 * @returns {Object} array item
 * @constructor
 */
function DefaultArrayItem(props) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  const arrayItemHeadingStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  return (
    <div
      ref={props.providedDraggable.innerRef}
      {...props.providedDraggable.draggableProps}
      {...props.providedDraggable.dragHandleProps}
    >
      <Panel className={props.className}>
        <Panel.Heading
          className="array-item-heading"
          style={arrayItemHeadingStyle}
        >
          <div>
            {props.title} {props.index + 1}
          </div>
          {props.hasToolbar && (
            <div className="array-item-toolbox">
              <div
                className="btn-group"
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                }}
              >
                {(props.hasMoveUp || props.hasMoveDown) && (
                  <IconButton
                    icon="arrow-up"
                    className="array-item-move-up"
                    tabIndex="-1"
                    style={btnStyle}
                    disabled={
                      props.disabled || props.readonly || !props.hasMoveUp
                    }
                    onClick={props.onReorderClick(props.index, props.index - 1)}
                  />
                )}

                {(props.hasMoveUp || props.hasMoveDown) && (
                  <IconButton
                    icon="arrow-down"
                    className="array-item-move-down"
                    tabIndex="-1"
                    style={btnStyle}
                    disabled={
                      props.disabled || props.readonly || !props.hasMoveDown
                    }
                    onClick={props.onReorderClick(props.index, props.index + 1)}
                  />
                )}

                {props.hasRemove && (
                  <IconButton
                    type="danger"
                    icon="remove"
                    className="array-item-remove"
                    tabIndex="-1"
                    style={btnStyle}
                    disabled={props.disabled || props.readonly}
                    onClick={props.onDropIndexClick(props.index)}
                  />
                )}
              </div>
            </div>
          )}
        </Panel.Heading>
        <Panel.Body>{props.children}</Panel.Body>
      </Panel>
    </div>
  );
}

DefaultArrayItem.propTypes = {
  index: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  hasToolbar: PropTypes.bool,
  children: PropTypes.any,
  hasMoveUp: PropTypes.bool,
  hasMoveDown: PropTypes.bool,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  onReorderClick: PropTypes.func,
  onDropIndexClick: PropTypes.func,
  hasRemove: PropTypes.bool,
  title: PropTypes.string.isRequired,
  providedDraggable: PropTypes.object.isRequired,
};

/**
 * Array component
 * @param props
 * @returns {Object} array representation
 * @constructor
 */
function DefaultFixedArrayFieldTemplate(props) {
  const isArrayNested = props.schema.contextPath.indexOf('INDEX') !== -1;
  const isOrderable = props.schema.orderable && props.items.length > 1;
  return (
    <DragDropContext
      onDragEnd={res => {
        if (res.source && res.destination) {
          props.onReorderClick(res.source.index, res.destination.index)();
        }
      }}
    >
      <fieldset className={props.className} id={props.idSchema.$id}>
        <Droppable
          style={{ transform: 'none' }}
          droppableId={props.idSchema.$id}
        >
          {providedDroppable => (
            <div
              className="row array-item-list"
              key={`array-item-list-${props.idSchema.$id}`}
              {...providedDroppable.droppableProps}
              ref={providedDroppable.innerRef}
            >
              {props.items.map((item, index) => (
                <Draggable
                  key={props.idSchema.$id + index} // eslint-disable-line
                  draggableId={props.idSchema.$id + index}
                  index={index}
                  isDragDisabled={!isOrderable || isArrayNested}
                >
                  {providedDraggable => (
                    <DefaultArrayItem
                      providedDraggable={providedDraggable}
                      {...item}
                    />
                  )}
                </Draggable>
              ))}

              {providedDroppable.placeholder}
            </div>
          )}
        </Droppable>

        {props.canAdd && (
          <AddButton
            className="array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
          />
        )}
      </fieldset>
    </DragDropContext>
  );
}

DefaultFixedArrayFieldTemplate.propTypes = {
  className: PropTypes.string,
  idSchema: PropTypes.object,
  TitleField: PropTypes.any,
  uiSchema: PropTypes.object,
  title: PropTypes.string,
  required: PropTypes.bool,
  schema: PropTypes.object,
  items: PropTypes.array,
  canAdd: PropTypes.object,
  onAddClick: PropTypes.func,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  onReorderClick: PropTypes.func,
};

/**
 * Array component
 * @param props
 * @returns {Object} array representation
 * @constructor
 */
function DefaultNormalArrayFieldTemplate(props) {
  const isArrayNested = props.schema.contextPath.indexOf('INDEX') !== -1;
  const isOrderable = props.schema.orderable && props.items.length > 1;
  return (
    <DragDropContext
      onDragEnd={res => {
        if (res.source && res.destination) {
          props.onReorderClick(res.source.index, res.destination.index)();
        }
      }}
    >
      <fieldset className={props.className} id={props.idSchema.$id}>
        <Droppable droppableId={props.idSchema.$id}>
          {providedDroppable => (
            <div
              className="row array-item-list"
              key={`array-item-list-${props.idSchema.$id}`}
              {...providedDroppable.droppableProps}
              ref={providedDroppable.innerRef}
            >
              {props.items &&
                props.items.map((p, index) => (
                  <Draggable
                    key={props.idSchema.$id + index} // eslint-disable-line
                    draggableId={props.idSchema.$id + index}
                    index={index}
                    isDragDisabled={!isOrderable || isArrayNested}
                  >
                    {providedDraggable => (
                      <DefaultArrayItem
                        {...p}
                        providedDraggable={providedDraggable}
                      />
                    )}
                  </Draggable>
                ))}

              {providedDroppable.placeholder}
            </div>
          )}
        </Droppable>
        {props.canAdd && (
          <AddButton
            className="array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
          />
        )}
      </fieldset>
    </DragDropContext>
  );
}

DefaultNormalArrayFieldTemplate.propTypes = {
  className: PropTypes.string,
  idSchema: PropTypes.object,
  items: PropTypes.array,
  canAdd: PropTypes.any,
  onAddClick: PropTypes.func,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  onReorderClick: PropTypes.func,
};

/**
 * Array field component
 */
class ArrayField extends Component {
  constructor(props) {
    super(props);

    if (props.formData.length === 0) {
      /* Add at least 1 empty item if there is none */
      this.addItem();
    }
  }

  static defaultProps = {
    uiSchema: {},
    formData: [],
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
  };

  /**
   * Gets item's title
   * @returns {string} item's title
   */
  get itemTitle() {
    const { schema } = this.props;
    return schema.items.title || schema.items.description || 'Item';
  }

  /**
   * Determine whether the item is required
   * @param itemSchema
   * @returns {boolean} required attribute
   */
  isItemRequired(itemSchema) {
    if (Array.isArray(itemSchema.type)) {
      return !includes(itemSchema.type, 'null');
    }
    /* All non-null array item types are inherently required by design */
    return itemSchema.type !== 'null';
  }

  /**
   * Determine whether the field can add items
   * @param formItems
   */
  canAddItem(formItems) {
    const { schema, uiSchema } = this.props;
    let { addable } = getUiOptions(uiSchema);
    if (addable !== false) {
      // if ui:options.addable was not explicitly set to false, we can add
      // another item if we have not exceeded maxItems yet
      if (schema.maxItems !== undefined) {
        addable = formItems.length < schema.maxItems;
      } else {
        addable = true;
      }
    }
    return addable;
  }

  /**
   * Adds an empty item to an array
   */
  addItem = () => {
    const { schema, formData, registry = getDefaultRegistry() } = this.props;
    const { definitions } = registry;
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    this.props.onChange([
      ...formData,
      getDefaultFormState(itemSchema, undefined, definitions),
    ]);
  };

  /**
   * Handles addition click
   * @param event click
   */
  onAddClick = event => {
    if (event) {
      event.preventDefault();
    }
    this.addItem();

    const {
      registry = getDefaultRegistry(),
      idSchema: { $id: id },
      schema,
    } = this.props;
    registry.formContext.addArrayItemToSchema(schema, id);
  };

  /**
   * Handles remove action
   * @param index
   * @returns {Function} to be executed on a remove button click
   */
  onDropIndexClick = index => event => {
    if (event) {
      event.preventDefault();
    }
    const {
      schema,
      formData,
      onChange,
      registry = getDefaultRegistry(),
      idSchema: { $id: id },
    } = this.props;
    let newErrorSchema;
    if (this.props.errorSchema) {
      newErrorSchema = {};
      const { errorSchema } = this.props;
      Object.keys(errorSchema).forEach(i => {
        const internalIndex = parseInt(i, 10);
        if (internalIndex < index) {
          newErrorSchema[internalIndex] = errorSchema[internalIndex];
        } else if (internalIndex > index) {
          newErrorSchema[internalIndex - 1] = errorSchema[internalIndex];
        }
      });
    }
    registry.formContext.removeArrayItemFromSchema(schema, id, index);
    onChange(formData.filter((_, i) => i !== index), newErrorSchema);
  };

  /**
   * Handles reordering
   * @param index
   * @param newIndex
   * @returns {Function} to be executed when click event is fired
   */
  onReorderClick = (index, newIndex) => event => {
    if (event) {
      event.preventDefault();
      event.target.blur();
    }
    const {
      formData,
      onChange,
      schema,
      idSchema: { $id: id },
      registry = getDefaultRegistry(),
    } = this.props;
    let newErrorSchema;
    if (this.props.errorSchema) {
      newErrorSchema = {};
      const { errorSchema } = this.props;
      Object.keys(errorSchema).forEach(i => {
        if (i === index) {
          newErrorSchema[newIndex] = errorSchema[index];
        } else if (i === newIndex) {
          newErrorSchema[index] = errorSchema[newIndex];
        } else {
          newErrorSchema[i] = errorSchema[i];
        }
      });
    }

    function reOrderArray() {
      // Copy item
      const newFormData = formData.slice();

      // Moves item from index to newIndex
      newFormData.splice(index, 1);
      newFormData.splice(newIndex, 0, formData[index]);

      return newFormData;
    }

    registry.formContext.reorderArrayItemsInSchema(schema, id, index, newIndex);
    onChange(reOrderArray(), newErrorSchema);
  };

  /**
   * Defines a function to handle a change in a specific array item
   * @param index of an item
   * @returns {Function} to be executed for change handling
   */
  onChangeForIndex = index => (value, errorSchema) => {
    const { formData, onChange } = this.props;
    const newFormData = formData.map((item, i) => {
      // We need to treat undefined items as nulls to have validation.
      // See https://github.com/tdegrunt/jsonschema/issues/206
      const jsonValue = typeof value === 'undefined' ? null : value;
      return index === i ? jsonValue : item;
    });
    const isValid = errorSchema && this.props.errorSchema;
    onChange(
      newFormData,
      isValid && {
        ...this.props.errorSchema,
        [index]: errorSchema,
      },
    );
  };

  /**
   * Handles select change
   * @param value that changed
   */
  onSelectChange = value => {
    this.props.onChange(value);
  };

  /**
   * render
   * @returns {Object} array field representation
   */
  render() {
    const {
      schema,
      uiSchema,
      idSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const { definitions } = registry;
    if (!Object.prototype.hasOwnProperty.call(schema, 'items')) {
      return (
        <UnsupportedField
          schema={schema}
          idSchema={idSchema}
          reason="Missing items definition"
        />
      );
    }
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (isMultiSelect(schema, definitions)) {
      return this.renderMultiSelect();
    }
    if (uiSchema['ui:widget'] === 'tags') {
      return this.renderTags();
    }
    if (uiSchema['ui:widget'] === 'file') {
      return this.renderFiles();
    }
    return this.renderNormalArray();
  }

  renderNormalArray() {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
      onFocus,
      idPrefix,
      rawErrors,
    } = this.props;
    const title = schema.title === undefined ? name : schema.title;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField, DescriptionField } = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const arrayProps = {
      canAdd: this.canAddItem(formData),
      items: formData.map((item, index) => {
        const itemSchema = retrieveSchema(schema.items, definitions, item);
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
        const itemIdPrefix = `${idSchema.$id}_${index}`;
        const itemIdSchema = toIdSchema(
          itemSchema,
          itemIdPrefix,
          definitions,
          item,
          idPrefix,
        );
        return this.renderArrayFieldItem({
          index,
          title,
          canRemove: formData.length > 1,
          canMoveUp: !!schema.orderable && index > 0,
          canMoveDown: !!schema.orderable && index < formData.length - 1,
          itemSchema,
          itemIdSchema,
          itemErrorSchema,
          itemData: item,
          itemUiSchema: uiSchema.items,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      DescriptionField,
      disabled,
      idSchema,
      uiSchema,
      onAddClick: this.onAddClick,
      onReorderClick: this.onReorderClick,
      readonly,
      required,
      schema,
      title,
      TitleField,
      formContext,
      formData,
      rawErrors,
    };

    /* Check if a custom render function was passed in */
    const Component = ArrayFieldTemplate || DefaultNormalArrayFieldTemplate; // eslint-disable-line
    return <Component {...arrayProps} />;
  }

  /**
   * Renders Image[], File[] fields
   * @returns {Object} File[], Image[] fields representations
   */
  renderFiles() {
    const {
      schema,
      idSchema,
      uiSchema,
      formData,
      disabled,
      readonly,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
      rawErrors,
    } = this.props;

    const items = formData;
    const { widgets, formContext } = registry;
    const { widget = 'file', ...options } = {
      ...getUiOptions(uiSchema),
    };
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        onChange={this.props.onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
        multiple
      />
    );
  }

  /**
   * Renders String[] field
   * @returns {Object} String[] field representation
   */
  renderTags() {
    const {
      schema,
      idSchema,
      uiSchema,
      formData,
      disabled,
      readonly,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
      rawErrors,
    } = this.props;
    const items = formData;
    const { widgets, formContext } = registry;
    const { widget = 'select', ...options } = {
      ...getUiOptions(uiSchema),
    };
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        onChange={this.props.onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
      />
    );
  }

  /**
   * Renders multiple select field
   * @returns {Object} multiple select field representation
   */
  renderMultiSelect() {
    const {
      schema,
      idSchema,
      uiSchema,
      formData,
      disabled,
      readonly,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
      rawErrors,
    } = this.props;
    const items = this.props.formData;
    const { widgets, definitions, formContext } = registry;
    const itemsSchema = retrieveSchema(schema.items, definitions, formData);
    const enumOptions = optionsList(itemsSchema);
    const { widget = 'select', ...options } = {
      ...getUiOptions(uiSchema),
      enumOptions,
    };
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        onFocus={onFocus}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
      />
    );
  }

  /**
   * Render array
   * @returns {Object} array representation
   */
  renderFixedArray() {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idPrefix,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
      onFocus,
      rawErrors,
    } = this.props;
    const title = schema.title || name;
    let items = this.props.formData;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField } = fields;
    const itemSchemas = schema.items.map((item, index) =>
      retrieveSchema(item, definitions, formData[index]),
    );
    const additionalSchema = allowAdditionalItems(schema)
      ? retrieveSchema(schema.additionalItems, definitions, formData)
      : null;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    /* These are the props passed into the render function */
    const arrayProps = {
      canAdd: this.canAddItem(items) && additionalSchema,
      className: 'field field-array field-array-fixed-items',
      disabled,
      idSchema,
      formData,
      items: items.map((item, index) => {
        const additional = index >= itemSchemas.length;
        const itemSchema = additional
          ? retrieveSchema(schema.additionalItems, definitions, item)
          : itemSchemas[index];
        const itemIdPrefix = `${idSchema.$id}_${index}`;
        const itemIdSchema = toIdSchema(
          itemSchema,
          itemIdPrefix,
          definitions,
          item,
          idPrefix,
        );
        /* eslint-disable no-nested-ternary */
        const itemUiSchema = uiSchema.additionalItems;
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

        return this.renderArrayFieldItem({
          index,
          title,
          canRemove: items.length > 1,
          canMoveUp: !!schema.orderable && index >= 1,
          canMoveDown: !!schema.orderable && index < items.length - 1,
          itemSchema,
          itemData: item,
          itemUiSchema,
          itemIdSchema,
          itemErrorSchema,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
        });
      }),
      onAddClick: this.onAddClick,
      onReorderClick: this.onReorderClick,
      readonly,
      required,
      schema,
      uiSchema,
      title,
      TitleField,
      formContext,
      rawErrors,
    };

    /* Check if a custom template template was passed in */
    const Template = ArrayFieldTemplate || DefaultFixedArrayFieldTemplate;
    return <Template {...arrayProps} />;
  }

  /**
   * Renders array item
   * @param props
   * @returns {Object} array item representaiton
   */
  renderArrayFieldItem(props) {
    const {
      index,
      canRemove = true,
      canMoveUp = true,
      canMoveDown = true,
      itemSchema,
      itemData,
      itemUiSchema,
      itemIdSchema,
      itemErrorSchema,
      autofocus,
      onBlur,
      onFocus,
      rawErrors,
      title,
    } = props;
    const {
      disabled,
      readonly,
      uiSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const {
      fields: { SchemaField },
    } = registry;
    const { orderable, removable } = {
      orderable: true,
      removable: true,
      ...uiSchema['ui:options'],
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove,
    };
    has.toolbar = Object.keys(has).some(key => has[key]);

    return {
      children: (
        <SchemaField
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          errorSchema={itemErrorSchema}
          idSchema={itemIdSchema}
          required={this.isItemRequired(itemSchema)}
          onChange={this.onChangeForIndex(index)}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={this.props.registry}
          disabled={this.props.disabled}
          readonly={this.props.readonly}
          autofocus={autofocus}
          rawErrors={rawErrors}
        />
      ),
      className: 'array-item',
      disabled,
      hasToolbar: has.toolbar,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index,
      onDropIndexClick: this.onDropIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
      title,
    };
  }
}

ArrayField.propTypes = types.fieldProps;

export default ArrayField;
