import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

import { SingleDatePickerInputPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import DateInput from './DateInput';
import IconPositionShape from '../shapes/IconPositionShape';

import CloseButton from './CloseButton';
import CalendarIcon from './CalendarIcon';

import openDirectionShape from '../shapes/OpenDirectionShape';
import { ICON_BEFORE_POSITION, ICON_AFTER_POSITION, OPEN_DOWN } from '../constants';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string, // also used as label
  displayValue: PropTypes.string,
  screenReaderMessage: PropTypes.string,
  focused: PropTypes.bool,
  isFocused: PropTypes.bool, // describes actual DOM focus
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  openDirection: openDirectionShape,
  showCaret: PropTypes.bool,
  showClearDate: PropTypes.bool,
  customCloseIcon: PropTypes.node,
  showDefaultInputIcon: PropTypes.bool,
  inputIconPosition: IconPositionShape,
  customInputIcon: PropTypes.node,
  isRTL: PropTypes.bool,
  noBorder: PropTypes.bool,
  block: PropTypes.bool,
  small: PropTypes.bool,
  regular: PropTypes.bool,
  verticalSpacing: nonNegativeInteger,

  onChange: PropTypes.func,
  onClearDate: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDownShiftTab: PropTypes.func,
  onKeyDownTab: PropTypes.func,
  onKeyDownArrowDown: PropTypes.func,
  onKeyDownQuestionMark: PropTypes.func,

  // i18n
  phrases: PropTypes.shape(getPhrasePropTypes(SingleDatePickerInputPhrases)),
});

const defaultProps = {
  placeholder: 'Select Date',
  displayValue: '',
  screenReaderMessage: '',
  focused: false,
  isFocused: false,
  disabled: false,
  required: false,
  readOnly: false,
  openDirection: OPEN_DOWN,
  showCaret: false,
  showClearDate: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customCloseIcon: null,
  customInputIcon: null,
  isRTL: false,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: undefined,

  onChange() {},
  onClearDate() {},
  onFocus() {},
  onKeyDownShiftTab() {},
  onKeyDownTab() {},
  onKeyDownArrowDown() {},
  onKeyDownQuestionMark() {},

  // i18n
  phrases: SingleDatePickerInputPhrases,
};

function SingleDatePickerInput({
  id,
  placeholder,
  displayValue,
  focused,
  isFocused,
  disabled,
  required,
  readOnly,
  showCaret,
  showClearDate,
  showDefaultInputIcon,
  inputIconPosition,
  phrases,
  onClearDate,
  onChange,
  onFocus,
  onKeyDownShiftTab,
  onKeyDownTab,
  onKeyDownArrowDown,
  onKeyDownQuestionMark,
  screenReaderMessage,
  customCloseIcon,
  customInputIcon,
  openDirection,
  isRTL,
  noBorder,
  block,
  small,
  regular,
  verticalSpacing,
  styles,
}) {
  const calendarIcon = customInputIcon || (
    <CalendarIcon {...css(styles['single-date-picker-input__calendar-icon-svg'])} />
  );
  const closeIcon = customCloseIcon || (
    <CloseButton
      {...css(
        styles['single-date-picker-input__clear-date-svg'],
        small && styles['single-date-picker-input__clear-date-svg--small'],
      )}
    />
  );

  const screenReaderText = screenReaderMessage || phrases.keyboardNavigationInstructions;
  const inputIcon = (showDefaultInputIcon || customInputIcon !== null) && (
    <button
      {...css(styles['single-date-picker-input__calendar-icon'])}
      type="button"
      disabled={disabled}
      aria-label={phrases.focusStartDate}
      onClick={onFocus}
    >
      {calendarIcon}
    </button>
  );

  return (
    <div
      {...css(
        styles['single-date-picker-input'],
        disabled && styles['single-date-picker-input--disabled'],
        isRTL && styles['single-date-picker-input--rtl'],
        !noBorder && styles['single-date-picker-input--with-border'],
        block && styles['single-date-picker-input--block'],
        showClearDate && styles['single-date-picker-input--show-clear-date'],
      )}
    >
      {inputIconPosition === ICON_BEFORE_POSITION && inputIcon}

      <DateInput
        id={id}
        placeholder={placeholder} // also used as label
        displayValue={displayValue}
        screenReaderMessage={screenReaderText}
        focused={focused}
        isFocused={isFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        showCaret={showCaret}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDownShiftTab={onKeyDownShiftTab}
        onKeyDownTab={onKeyDownTab}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        openDirection={openDirection}
        verticalSpacing={verticalSpacing}
        small={small}
        regular={regular}
        block={block}
      />

      {showClearDate && (
        <button
          {...css(
            styles['single-date-picker-input__clear-date'],
            small && styles['single-date-picker-input__clear-date--small'],
            !customCloseIcon && styles['single-date-picker-input__clear-date--default'],
            !displayValue && styles['single-date-picker-input__clear-date--hide'],
          )}
          type="button"
          aria-label={phrases.clearDate}
          disabled={disabled}
          onMouseEnter={this.onClearDateMouseEnter}
          onMouseLeave={this.onClearDateMouseLeave}
          onClick={onClearDate}
        >
          {closeIcon}
        </button>
      )}

      {inputIconPosition === ICON_AFTER_POSITION && inputIcon}

    </div>
  );
}

SingleDatePickerInput.propTypes = propTypes;
SingleDatePickerInput.defaultProps = defaultProps;

export default withStyles(({ reactDates: { border, color } }) => ({
  'single-date-picker-input': {
    display: 'inline-block',
    backgroundColor: color.background,
  },

  'single-date-picker-input--with-border': {
    borderColor: color.border,
    borderWidth: border.pickerInput.borderWidth,
    borderStyle: border.pickerInput.borderStyle,
    borderRadius: border.pickerInput.borderRadius,
  },

  'single-date-picker-input--rtl': {
    direction: 'rtl',
  },

  'single-date-picker-input--disabled': {
    backgroundColor: color.disabled,
  },

  'single-date-picker-input--block': {
    display: 'block',
  },

  'single-date-picker-input--show-clear-date': {
    paddingRight: 30,
  },

  'single-date-picker-input__clear-date': {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',

    cursor: 'pointer',
    padding: 10,
    margin: '0 10px 0 5px',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
  },

  'single-date-picker-input__clear-date--default': {
    ':focus': {
      background: color.core.border,
      borderRadius: '50%',
    },

    ':hover': {
      background: color.core.border,
      borderRadius: '50%',
    },
  },

  'single-date-picker-input__clear-date--small': {
    padding: 6,
  },

  'single-date-picker-input__clear-date--hide': {
    visibility: 'hidden',
  },

  'single-date-picker-input__clear-date-svg': {
    fill: color.core.grayLight,
    height: 12,
    width: 15,
    verticalAlign: 'middle',
  },

  'single-date-picker-input__clear-date-svg--small': {
    height: 9,
  },

  'single-date-picker-input__calendar-icon': {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',

    cursor: 'pointer',
    display: 'inline-block',
    verticalAlign: 'middle',
    padding: 10,
    margin: '0 5px 0 10px',
  },

  'single-date-picker-input__calendar-icon-svg': {
    fill: color.core.grayLight,
    height: 15,
    width: 14,
    verticalAlign: 'middle',
  },
}))(SingleDatePickerInput);
