import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'cropperjs';
import _ from 'lodash';
import 'cropperjs/dist/cropper.css';
import Webcam from 'components/Webcam';
import Cropzone from 'components/Cropzone';
import { getAuthHeader } from 'utils/getAuthHeader';
import bindThisToFunctions from 'utils/bindThisToFunctions';
import { shouldRender } from '../../utils';
import { API_URL } from '../../../../constants';

const dataURItoBlob = dataURI => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i += 1) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mimeString });
};

class FileWidget extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = { values }; // eslint-disable-line

    const { multiple, schema } = props;

    if (schema.arguments) {
      const { maxFileSize, contentType } = schema.arguments;

      this.state.options = {
        maxFilesize: maxFileSize / 1000000,
        acceptedFiles: contentType || schema.contentType,
        maxFiles: multiple ? null : 1,
      };
    }

    bindThisToFunctions(this, this.renderCropper, this.onChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = files => {
    const { onChange, multiple } = this.props;
    const state = {
      values: files,
    };
    this.setState(state, () => {
      if (multiple) {
        onChange(state.values);
      } else {
        onChange(state.values[0]);
      }
    });
  };

  renderCropper(file, done, cropzone) {
    const {
      container,
      props: { schema },
    } = this;

    const editor = document.createElement('div');
    editor.style.position = 'absolute';
    editor.style.left = 0;
    editor.style.right = 0;
    editor.style.top = 0;
    editor.style.bottom = 0;
    editor.style.zIndex = 9999;
    editor.style.backgroundColor = '#fff';
    container.appendChild(editor);

    const buttonConfirm = document.createElement('button');
    buttonConfirm.classList.add('btn', 'btn-default');
    buttonConfirm.style.position = 'absolute';
    buttonConfirm.style.left = '10px';
    buttonConfirm.style.top = '10px';
    buttonConfirm.style.zIndex = 9999;
    buttonConfirm.textContent = 'Confirm';
    editor.appendChild(buttonConfirm);

    let width = false;
    let height = false;
    let aspect = null;

    if (schema.arguments) {
      const { croppedWidth, croppedHeight, aspectRatio } = schema.arguments;
      if (aspectRatio) {
        if (!croppedWidth && croppedHeight) {
          height = croppedHeight;
          width = croppedHeight * aspectRatio;
          aspect = width / height;
        } else if (croppedWidth && !croppedHeight) {
          width = croppedWidth;
          height = croppedWidth / aspectRatio;
          aspect = width / height;
        } else {
          aspect = aspectRatio;
        }
      }
    }
    /* eslint-disable prefer-arrow-callback */
    buttonConfirm.addEventListener('click', function() {
      const canvas = cropper.getCroppedCanvas({
        width,
        height,
      });
      canvas.toBlob(blob => {
        cropzone.createThumbnail(
          blob,
          cropzone.options.thumbnailWidth,
          cropzone.options.thumbnailHeight,
          cropzone.options.thumbnailMethod,
          false,
          dataURL => {
            cropzone.emit('thumbnail', file, dataURL);
            done(blob);
          },
        );
      });
      container.removeChild(editor);
    });

    const image = new Image();
    image.src = URL.createObjectURL(file);
    editor.appendChild(image);

    const cropper = new Cropper(image, {
      aspectRatio: aspect,
    });
  }

  render() {
    const {
      renderCropper,
      onChange,
      props: { schema },
      state: { values },
    } = this;

    let camera = null;

    if (schema && schema.arguments && schema.arguments.enablePhotoCapture) {
      camera = (
        <div className="form-group field">
          <Webcam
            className="form-webcam"
            onSave={file => {
              const capture = dataURItoBlob(file);
              const type = capture.type.split('/')[1];
              capture.name = `photo_capture_${new Date().toISOString()}.${type}`;
              try {
                this.cropzone.addFile(capture);
              } catch (e) {
                console.log();
              }
            }}
          />
        </div>
      );
    }

    return (
      <div
        ref={el => {
          this.container = el;
        }}
      >
        <Cropzone
          setRef={el => {
            this.cropzone = el;
          }}
          options={{
            url: `${API_URL}/upload`,
            headers: {
              Accept: 'application/json',
              'Cache-Control': '',
              'X-Requested-With': '',
              ...getAuthHeader(),
            },
            addRemoveLinks: true,
            init() {
              this.on('addedfile', file => {
                if (file.type.indexOf('image') !== 0) {
                  const type = file.type.replace(/\//, '-');
                  try {
                    import(`custom_assets/public/default-thumbnails/${type}.png`).then(
                      typeThumbnail => {
                        this.emit('thumbnail', file, typeThumbnail.default);
                      },
                    );
                  } catch {
                    console.warn(
                      `Could not find default thumbnail for ${file.type} type`,
                    );
                  }
                }
              });
              this.on('removedfile', file => {
                const stateFiles = _.cloneDeep(values);

                values.forEach((stateFile, idx) => {
                  if (file.id === stateFile.id) {
                    stateFiles.splice(idx, 1);
                  }
                });
                onChange(stateFiles);
              });
              if (Array.isArray(values)) {
                values.forEach(file => {
                  this.files.push(file);
                  this.emit('addedfile', file);
                  this.emit('complete', file);
                });
              }
            },
            /* eslint-disable consistent-return */
            accept(file, done) {
              if (file.type.indexOf('image') !== 0) {
                done();
              }
              if (schema.arguments) {
                const {
                  minWidth,
                  maxWidth,
                  minHeight,
                  maxHeight,
                  enableCropper,
                } = schema.arguments;
                if (enableCropper) {
                  return done();
                }
                const fileReader = new FileReader();
                fileReader.onload = () => {
                  const img = new Image();
                  img.onload = () => {
                    const { width, height } = img;

                    if (minWidth > width) {
                      return done(
                        `The minimum width of an image is ${minWidth}px`,
                      );
                    }
                    if (maxWidth < width) {
                      return done(
                        `The maximum width of an image is ${maxWidth}px`,
                      );
                    }
                    if (minHeight > height) {
                      return done(
                        `The minimum height of an image is ${minHeight}px`,
                      );
                    }
                    if (maxHeight < height) {
                      return done(
                        `The maximum height of an image is ${maxHeight}px`,
                      );
                    }
                    return done();
                  };
                  img.src = fileReader.result;
                };
                fileReader.readAsDataURL(file);
              } else {
                done();
              }
            },
            transformFile(file, done) {
              if (schema.arguments && schema.arguments.enableCropper) {
                if (file.type.indexOf('image') === 0) {
                  renderCropper(file, done, this);
                } else {
                  done(file);
                }
              } else {
                done(file);
              }
            },
            success: (file, response) => {
              const { data } = response;

              this.onChange([...this.state.values, ...data]);
            },
            ...this.state.options,
          }}
        />
        {camera}
      </div>
    );
  }
}

FileWidget.propTypes = {
  multiple: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object),
  ]),
  onChange: PropTypes.func,
  schema: PropTypes.object.isRequired,
};

export default FileWidget;
