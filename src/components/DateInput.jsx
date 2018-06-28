import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';
import throttle from 'lodash/throttle';
import isTouchDevice from 'is-touch-device';

import getInputHeight from '../utils/getInputHeight';
import openDirectionShape from '../shapes/OpenDirectionShape';
import {
  OPEN_DOWN,
  OPEN_UP,
  FANG_HEIGHT_PX,
  FANG_WIDTH_PX,
  DEFAULT_VERTICAL_SPACING,
  MODIFIER_KEY_NAMES,
} from '../constants';

const FANG_PATH_TOP = `M0,${FANG_HEIGHT_PX} ${FANG_WIDTH_PX},${FANG_HEIGHT_PX} ${FANG_WIDTH_PX / 2},0z`;
const FANG_STROKE_TOP = `M0,${FANG_HEIGHT_PX} ${FANG_WIDTH_PX / 2},0 ${FANG_WIDTH_PX},${FANG_HEIGHT_PX}`;
const FANG_PATH_BOTTOM = `M0,0 ${FANG_WIDTH_PX},0 ${FANG_WIDTH_PX / 2},${FANG_HEIGHT_PX}z`;
const FANG_STROKE_BOTTOM = `M0,0 ${FANG_WIDTH_PX / 2},${FANG_HEIGHT_PX} ${FANG_WIDTH_PX},0`;

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string, // also used as label
  displayValue: PropTypes.string,
  screenReaderMessage: PropTypes.string,
  focused: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  openDirection: openDirectionShape,
  showCaret: PropTypes.bool,
  verticalSpacing: nonNegativeInteger,
  small: PropTypes.bool,
  block: PropTypes.bool,
  regular: PropTypes.bool,

  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDownShiftTab: PropTypes.func,
  onKeyDownTab: PropTypes.func,

  onKeyDownArrowDown: PropTypes.func,
  onKeyDownQuestionMark: PropTypes.func,

  // accessibility
  isFocused: PropTypes.bool, // describes actual DOM focus
});

const defaultProps = {
  placeholder: 'Select Date',
  displayValue: '',
  screenReaderMessage: '',
  focused: false,
  disabled: false,
  required: false,
  readOnly: null,
  openDirection: OPEN_DOWN,
  showCaret: false,
  verticalSpacing: DEFAULT_VERTICAL_SPACING,
  small: false,
  block: false,
  regular: false,

  onChange() {},
  onFocus() {},
  onKeyDownShiftTab() {},
  onKeyDownTab() {},

  onKeyDownArrowDown() {},
  onKeyDownQuestionMark() {},

  // accessibility
  isFocused: false,
};

class DateInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dateString: '',
      isTouchDevice: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.setInputRef = this.setInputRef.bind(this);
    this.throttledKeyDown = throttle(this.onFinalKeyDown, 300, { trailing: false });
  }

  componentDidMount() {
    this.setState({ isTouchDevice: isTouchDevice() });
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.dateString && nextProps.displayValue) {
      this.setState({
        dateString: '',
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { focused, isFocused } = this.props;
    if (prevProps.focused === focused && prevProps.isFocused === isFocused) return;

    if (focused && isFocused) {
      this.inputRef.focus();
    }
  }

  onChange(e) {
    const { onChange, onKeyDownQuestionMark } = this.props;
    const dateString = e.target.value;

    // In Safari, onKeyDown does not consistently fire ahead of onChange. As a result, we need to
    // special case the `?` key so that it always triggers the appropriate callback, instead of
    // modifying the input value
    if (dateString[dateString.length - 1] === '?') {
      onKeyDownQuestionMark(e);
    } else {
      this.setState({ dateString }, () => onChange(dateString));
    }
  }

  onKeyDown(e) {
    e.stopPropagation();
    if (!MODIFIER_KEY_NAMES.has(e.key)) {
      this.throttledKeyDown(e);
    }
  }

  onFinalKeyDown(e) {
    const {
      onKeyDownShiftTab,
      onKeyDownTab,
      onKeyDownArrowDown,
      onKeyDownQuestionMark,
    } = this.props;
    const { key } = e;

    if (key === 'Tab') {
      if (e.shiftKey) {
        onKeyDownShiftTab(e);
      } else {
        onKeyDownTab(e);
      }
    } else if (key === 'ArrowDown') {
      onKeyDownArrowDown(e);
    } else if (key === '?') {
      e.preventDefault();
      onKeyDownQuestionMark(e);
    }
  }

  setInputRef(ref) {
    this.inputRef = ref;
  }

  render() {
    const {
      dateString,
      isTouchDevice: isTouch,
    } = this.state;
    const {
      id,
      placeholder,
      displayValue,
      screenReaderMessage,
      focused,
      showCaret,
      onFocus,
      disabled,
      required,
      readOnly,
      openDirection,
      verticalSpacing,
      small,
      regular,
      block,
      styles,
      theme: { reactDates },
    } = this.props;

    const value = displayValue || dateString || '';
    const screenReaderMessageId = `DateInput__screen-reader-message-${id}`;

    const withFang = showCaret && focused;

    const inputHeight = getInputHeight(reactDates, small);

    return (
      <div
        {...css(
          styles['date-input'],
          small && styles['date-input--small'],
          block && styles['date-input--block'],
          withFang && styles['date-input--with-fang'],
          disabled && styles['date-input--disabled'],
          withFang && openDirection === OPEN_DOWN && styles['date-input--open-down'],
          withFang && openDirection === OPEN_UP && styles['date-input--open-up'],
        )}
      >
        <input
          {...css(
            styles['date-input__input'],
            small && styles['date-input__input--small'],
            regular && styles['date-input__input--regular'],
            readOnly && styles['date-input__input--read-only'],
            focused && styles['date-input__input--focused'],
            disabled && styles['date-input__input--disabled'],
          )}
          aria-label={placeholder}
          type="text"
          id={id}
          name={id}
          ref={this.setInputRef}
          value={value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          readOnly={typeof readOnly === 'boolean' ? readOnly : isTouch}
          required={required}
          aria-describedby={screenReaderMessage && screenReaderMessageId}
        />

        {withFang && (
          <svg
            role="presentation"
            focusable="false"
            {...css(
              styles['date-input__fang'],
              openDirection === OPEN_DOWN && {
                top: inputHeight + verticalSpacing - FANG_HEIGHT_PX - 1,
              },
              openDirection === OPEN_UP && {
                bottom: inputHeight + verticalSpacing - FANG_HEIGHT_PX - 1,
              },
            )}
          >
            <path
              {...css(styles['date-input__fang-shape'])}
              d={openDirection === OPEN_DOWN ? FANG_PATH_TOP : FANG_PATH_BOTTOM}
            />
            <path
              {...css(styles['date-input__fang-stroke'])}
              d={openDirection === OPEN_DOWN ? FANG_STROKE_TOP : FANG_STROKE_BOTTOM}
            />
          </svg>
        )}

        {screenReaderMessage && (
          <p {...css(styles['date-input__screen-reader-message'])} id={screenReaderMessageId}>
            {screenReaderMessage}
          </p>
        )}
      </div>
    );
  }
}

DateInput.propTypes = propTypes;
DateInput.defaultProps = defaultProps;

export default withStyles(({
  reactDates: {
    border, color, sizing, spacing, font, zIndex,
  },
}) => ({
  'date-input': {
    margin: 0,
    padding: spacing.inputPadding,
    background: color.background,
    position: 'relative',
    display: 'inline-block',
    width: sizing.inputWidth,
    verticalAlign: 'middle',
  },

  'date-input--small': {
    width: sizing.inputWidth_small,
  },

  'date-input--block': {
    width: '100%',
  },

  'date-input--disabled': {
    background: color.disabled,
    color: color.textDisabled,
  },

  'date-input__input': {
    fontWeight: 200,
    fontSize: font.input.size,
    lineHeight: font.input.lineHeight,
    color: color.text,
    backgroundColor: color.background,
    width: '100%',
    padding: `${spacing.displayTextPaddingVertical}px ${spacing.displayTextPaddingHorizontal}px`,
    paddingTop: spacing.displayTextPaddingTop,
    paddingBottom: spacing.displayTextPaddingBottom,
    paddingLeft: spacing.displayTextPaddingLeft,
    paddingRight: spacing.displayTextPaddingRight,
    border: border.input.border,
    borderTop: border.input.borderTop,
    borderRight: border.input.borderRight,
    borderBottom: border.input.borderBottom,
    borderLeft: border.input.borderLeft,
    borderRadius: border.input.borderRadius,
  },

  'date-input__input--small': {
    fontSize: font.input.size_small,
    lineHeight: font.input.lineHeight_small,
    letterSpacing: font.input.letterSpacing_small,
    padding: `${spacing.displayTextPaddingVertical_small}px ${spacing.displayTextPaddingHorizontal_small}px`,
    paddingTop: spacing.displayTextPaddingTop_small,
    paddingBottom: spacing.displayTextPaddingBottom_small,
    paddingLeft: spacing.displayTextPaddingLeft_small,
    paddingRight: spacing.displayTextPaddingRight_small,
  },

  'date-input__input--regular': {
    fontWeight: 'auto',
  },

  'date-input__input--read-only': {
    userSelect: 'none',
  },

  'date-input__input--focused': {
    outline: border.input.outlineFocused,
    background: color.backgroundFocused,
    border: border.input.borderFocused,
    borderTop: border.input.borderTopFocused,
    borderRight: border.input.borderRightFocused,
    borderBottom: border.input.borderBottomFocused,
    borderLeft: border.input.borderLeftFocused,
  },

  'date-input__input--disabled': {
    background: color.disabled,
    fontStyle: font.input.styleDisabled,
  },

  'date-input__screen-reader-message': {
    border: 0,
    clip: 'rect(0, 0, 0, 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: 1,
  },

  'date-input__fang': {
    position: 'absolute',
    width: FANG_WIDTH_PX,
    height: FANG_HEIGHT_PX,
    left: 22,
    zIndex: zIndex + 2,
  },

  'date-input__fang-shape': {
    fill: color.background,
  },

  'date-input__fang-stroke': {
    stroke: color.core.border,
    fill: 'transparent',
  },
}))(DateInput);
