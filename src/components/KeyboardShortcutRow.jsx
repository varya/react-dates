import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  unicode: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  block: PropTypes.bool,
});

const defaultProps = {
  block: false,
};

function KeyboardShortcutRow({
  unicode,
  label,
  action,
  block,
  styles,
}) {
  return (
    <li
      {...css(
        styles['keyboard-shortcut-row'],
        block && styles['keyboard-shortcut-row--block'],
      )}
    >
      <div
        {...css(
          styles['keyboard-shortcut-row__key-container'],
          block && styles['keyboard-shortcut-row__key-container--block'],
        )}
      >
        <span
          {...css(styles['keyboard-shortcut-row__key'])}
          role="img"
          aria-label={`${label},`} // add comma so screen readers will pause before reading action
        >
          {unicode}
        </span>
      </div>

      <div {...css(styles['keyboard-shortcut-row__action'])}>
        {action}
      </div>
    </li>
  );
}

KeyboardShortcutRow.propTypes = propTypes;
KeyboardShortcutRow.defaultProps = defaultProps;

export default withStyles(({ reactDates: { color } }) => ({
  'keyboard-shortcut-row': {
    listStyle: 'none',
    margin: '6px 0',
  },

  'keyboard-shortcut-row--block': {
    marginBottom: 16,
  },

  'keyboard-shortcut-row__key-container': {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    marginRight: 6,
  },

  'keyboard-shortcut-row__key-container--block': {
    textAlign: 'left',
    display: 'inline',
  },

  'keyboard-shortcut-row__key': {
    fontFamily: 'monospace',
    fontSize: 12,
    textTransform: 'uppercase',
    background: color.core.grayLightest,
    padding: '2px 6px',
  },

  'keyboard-shortcut-row__action': {
    display: 'inline',
    wordBreak: 'break-word',
    marginLeft: 8,
  },
}))(KeyboardShortcutRow);

