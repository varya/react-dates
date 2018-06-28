import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

import { DayPickerKeyboardShortcutsPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import KeyboardShortcutRow from './KeyboardShortcutRow';
import CloseButton from './CloseButton';

export const TOP_LEFT = 'top-left';
export const TOP_RIGHT = 'top-right';
export const BOTTOM_RIGHT = 'bottom-right';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  block: PropTypes.bool,
  buttonLocation: PropTypes.oneOf([TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT]),
  showKeyboardShortcutsPanel: PropTypes.bool,
  openKeyboardShortcutsPanel: PropTypes.func,
  closeKeyboardShortcutsPanel: PropTypes.func,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerKeyboardShortcutsPhrases)),
});

const defaultProps = {
  block: false,
  buttonLocation: BOTTOM_RIGHT,
  showKeyboardShortcutsPanel: false,
  openKeyboardShortcutsPanel() {},
  closeKeyboardShortcutsPanel() {},
  phrases: DayPickerKeyboardShortcutsPhrases,
};

function getKeyboardShortcuts(phrases) {
  return [
    {
      unicode: '↵',
      label: phrases.enterKey,
      action: phrases.selectFocusedDate,
    },
    {
      unicode: '←/→',
      label: phrases.leftArrowRightArrow,
      action: phrases.moveFocusByOneDay,
    },
    {
      unicode: '↑/↓',
      label: phrases.upArrowDownArrow,
      action: phrases.moveFocusByOneWeek,
    },
    {
      unicode: 'PgUp/PgDn',
      label: phrases.pageUpPageDown,
      action: phrases.moveFocusByOneMonth,
    },
    {
      unicode: 'Home/End',
      label: phrases.homeEnd,
      action: phrases.moveFocustoStartAndEndOfWeek,
    },
    {
      unicode: 'Esc',
      label: phrases.escape,
      action: phrases.returnFocusToInput,
    },
    {
      unicode: '?',
      label: phrases.questionMark,
      action: phrases.openThisPanel,
    },
  ];
}

class DayPickerKeyboardShortcuts extends React.Component {
  constructor(...args) {
    super(...args);

    this.keyboardShortcuts = getKeyboardShortcuts(this.props.phrases);

    this.onShowKeyboardShortcutsButtonClick = this.onShowKeyboardShortcutsButtonClick.bind(this);
    this.setShowKeyboardShortcutsButtonRef = this.setShowKeyboardShortcutsButtonRef.bind(this);
    this.setHideKeyboardShortcutsButtonRef = this.setHideKeyboardShortcutsButtonRef.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.phrases !== this.props.phrases) {
      this.keyboardShortcuts = getKeyboardShortcuts(nextProps.phrases);
    }
  }

  componentDidUpdate() {
    this.handleFocus();
  }

  onKeyDown(e) {
    e.stopPropagation();

    const { closeKeyboardShortcutsPanel } = this.props;
    // Because the close button is the only focusable element inside of the panel, this
    // amounts to a very basic focus trap. The user can exit the panel by "pressing" the
    // close button or hitting escape
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'Spacebar': // for older browsers
      case 'Escape':
        closeKeyboardShortcutsPanel();
        break;

      // do nothing - this allows the up and down arrows continue their
      // default behavior of scrolling the content of the Keyboard Shortcuts Panel
      // which is needed when only a single month is shown for instance.
      case 'ArrowUp':
      case 'ArrowDown':
        break;

      // completely block the rest of the keys that have functionality outside of this panel
      case 'Tab':
      case 'Home':
      case 'End':
      case 'PageUp':
      case 'PageDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        break;

      default:
        break;
    }
  }

  onShowKeyboardShortcutsButtonClick() {
    const { openKeyboardShortcutsPanel } = this.props;

    // we want to return focus to this button after closing the keyboard shortcuts panel
    openKeyboardShortcutsPanel(() => { this.showKeyboardShortcutsButton.focus(); });
  }

  setShowKeyboardShortcutsButtonRef(ref) {
    this.showKeyboardShortcutsButton = ref;
  }

  setHideKeyboardShortcutsButtonRef(ref) {
    this.hideKeyboardShortcutsButton = ref;
  }

  handleFocus() {
    if (this.hideKeyboardShortcutsButton) {
      // automatically move focus into the dialog by moving
      // to the only interactive element, the hide button
      this.hideKeyboardShortcutsButton.focus();
    }
  }

  render() {
    const {
      block,
      buttonLocation,
      showKeyboardShortcutsPanel,
      closeKeyboardShortcutsPanel,
      styles,
      phrases,
    } = this.props;

    const toggleButtonText = showKeyboardShortcutsPanel
      ? phrases.hideKeyboardShortcutsPanel
      : phrases.showKeyboardShortcutsPanel;

    const bottomRight = buttonLocation === BOTTOM_RIGHT;
    const topRight = buttonLocation === TOP_RIGHT;
    const topLeft = buttonLocation === TOP_LEFT;

    return (
      <div>
        <button
          ref={this.setShowKeyboardShortcutsButtonRef}
          {...css(
            styles['daypicker-keyboard-shortcuts__button-reset'],
            styles['daypicker-keyboard-shortcuts__show'],
            bottomRight && styles['daypicker-keyboard-shortcuts__show--bottom-right'],
            topRight && styles['daypicker-keyboard-shortcuts__show--top-right'],
            topLeft && styles['daypicker-keyboard-shortcuts__show--top-left'],
          )}
          type="button"
          aria-label={toggleButtonText}
          onClick={this.onShowKeyboardShortcutsButtonClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            } else if (e.key === 'Space') {
              this.onShowKeyboardShortcutsButtonClick(e);
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.blur();
          }}
        >
          <span
            {...css(
              styles['daypicker-keyboard-shortcuts__show-span'],
              bottomRight && styles['daypicker-keyboard-shortcuts__show-span--bottom-right'],
              topRight && styles['daypicker-keyboard-shortcuts__show-span--top-right'],
              topLeft && styles['daypicker-keyboard-shortcuts__show-span--top-left'],
            )}
          >
            ?
          </span>
        </button>

        {showKeyboardShortcutsPanel &&
          <div
            {...css(styles['daypicker-keyboard-shortcuts__panel'])}
            role="dialog"
            aria-labelledby="daypicker-keyboard-shortcuts__title"
            aria-describedby="DayPickerKeyboardShortcuts_description"
          >
            <div
              {...css(styles['daypicker-keyboard-shortcuts__title'])}
              id="daypicker-keyboard-shortcuts__title"
            >
              {phrases.keyboardShortcuts}
            </div>

            <button
              ref={this.setHideKeyboardShortcutsButtonRef}
              {...css(
                styles['daypicker-keyboard-shortcuts__button-reset'],
                styles['daypicker-keyboard-shortcuts__close'],
              )}
              type="button"
              tabIndex="0"
              aria-label={phrases.hideKeyboardShortcutsPanel}
              onClick={closeKeyboardShortcutsPanel}
              onKeyDown={this.onKeyDown}
            >
              <CloseButton {...css(styles['daypicker-keyboard-shortcuts__close-svg'])} />
            </button>

            <ul
              {...css(styles['daypicker-keyboard-shortcuts__list'])}
              id="DayPickerKeyboardShortcuts_description"
            >
              {this.keyboardShortcuts.map(({ unicode, label, action }) => (
                <KeyboardShortcutRow
                  key={label}
                  unicode={unicode}
                  label={label}
                  action={action}
                  block={block}
                />
              ))}
            </ul>
          </div>
        }
      </div>
    );
  }
}

DayPickerKeyboardShortcuts.propTypes = propTypes;
DayPickerKeyboardShortcuts.defaultProps = defaultProps;

export default withStyles(({ reactDates: { color, font, zIndex } }) => ({
  'daypicker-keyboard-shortcuts__button-reset': {
    background: 'none',
    border: 0,
    borderRadius: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',
    padding: 0,
    cursor: 'pointer',
    fontSize: font.size,

    ':active': {
      outline: 'none',
    },
  },

  'daypicker-keyboard-shortcuts__show': {
    width: 22,
    position: 'absolute',
    zIndex: zIndex + 2,
  },

  'daypicker-keyboard-shortcuts__show--bottom-right': {
    borderTop: '26px solid transparent',
    borderRight: `33px solid ${color.core.primary}`,
    bottom: 0,
    right: 0,

    ':hover': {
      borderRight: `33px solid ${color.core.primary_dark}`,
    },
  },

  'daypicker-keyboard-shortcuts__show--top-right': {
    borderBottom: '26px solid transparent',
    borderRight: `33px solid ${color.core.primary}`,
    top: 0,
    right: 0,

    ':hover': {
      borderRight: `33px solid ${color.core.primary_dark}`,
    },
  },

  'daypicker-keyboard-shortcuts__show--top-left': {
    borderBottom: '26px solid transparent',
    borderLeft: `33px solid ${color.core.primary}`,
    top: 0,
    left: 0,

    ':hover': {
      borderLeft: `33px solid ${color.core.primary_dark}`,
    },
  },

  'daypicker-keyboard-shortcuts__show-span': {
    color: color.core.white,
    position: 'absolute',
  },

  'daypicker-keyboard-shortcuts__show-span--bottom-right': {
    bottom: 0,
    right: -28,
  },

  'daypicker-keyboard-shortcuts__show-span--top-right': {
    top: 1,
    right: -28,
  },

  'daypicker-keyboard-shortcuts__show-span--top-left': {
    top: 1,
    left: -28,
  },

  'daypicker-keyboard-shortcuts__panel': {
    overflow: 'auto',
    background: color.background,
    border: `1px solid ${color.core.border}`,
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: zIndex + 2,
    padding: 22,
    margin: 33,
  },

  'daypicker-keyboard-shortcuts__title': {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 0,
  },

  'daypicker-keyboard-shortcuts__list': {
    listStyle: 'none',
    padding: 0,
    fontSize: font.size,
  },

  'daypicker-keyboard-shortcuts__close': {
    position: 'absolute',
    right: 22,
    top: 22,
    zIndex: zIndex + 2,

    ':active': {
      outline: 'none',
    },
  },

  'daypicker-keyboard-shortcuts__close-svg': {
    height: 15,
    width: 15,
    fill: color.core.grayLighter,

    ':hover': {
      fill: color.core.grayLight,
    },

    ':focus': {
      fill: color.core.grayLight,
    },
  },
}))(DayPickerKeyboardShortcuts);
