import React from 'react';
import PropTypes from 'prop-types';
import shallowCompare from 'react-addons-shallow-compare';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';
import moment from 'moment';

import { CalendarDayPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import getCalendarDaySettings from '../utils/getCalendarDaySettings';

import { DAY_SIZE } from '../constants';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  day: momentPropTypes.momentObj,
  daySize: nonNegativeInteger,
  isOutsideDay: PropTypes.bool,
  modifiers: PropTypes.instanceOf(Set),
  isFocused: PropTypes.bool,
  tabIndex: PropTypes.oneOf([0, -1]),
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  renderDayContents: PropTypes.func,
  ariaLabelFormat: PropTypes.string,

  // internationalization
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
});

const defaultProps = {
  day: moment(),
  daySize: DAY_SIZE,
  isOutsideDay: false,
  modifiers: new Set(),
  isFocused: false,
  tabIndex: -1,
  onDayClick() {},
  onDayMouseEnter() {},
  onDayMouseLeave() {},
  renderDayContents: null,
  ariaLabelFormat: 'dddd, LL',

  // internationalization
  phrases: CalendarDayPhrases,
};

class CalendarDay extends React.Component {
  constructor(...args) {
    super(...args);

    this.setButtonRef = this.setButtonRef.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  componentDidUpdate(prevProps) {
    const { isFocused, tabIndex } = this.props;
    if (tabIndex === 0) {
      if (isFocused || tabIndex !== prevProps.tabIndex) {
        this.buttonRef.focus();
      }
    }
  }

  onDayClick(day, e) {
    const { onDayClick } = this.props;
    onDayClick(day, e);
  }

  onDayMouseEnter(day, e) {
    const { onDayMouseEnter } = this.props;
    onDayMouseEnter(day, e);
  }

  onDayMouseLeave(day, e) {
    const { onDayMouseLeave } = this.props;
    onDayMouseLeave(day, e);
  }

  onKeyDown(day, e) {
    const {
      onDayClick,
    } = this.props;

    const { key } = e;
    if (key === 'Enter' || key === ' ') {
      onDayClick(day, e);
    }
  }

  setButtonRef(ref) {
    this.buttonRef = ref;
  }

  render() {
    const {
      day,
      ariaLabelFormat,
      daySize,
      isOutsideDay,
      modifiers,
      renderDayContents,
      tabIndex,
      styles,
      phrases,
    } = this.props;

    if (!day) return <td />;

    const {
      daySizeStyles,
      useDefaultCursor,
      selected,
      hoveredSpan,
      isOutsideRange,
      ariaLabel,
    } = getCalendarDaySettings(day, ariaLabelFormat, daySize, modifiers, phrases);

    return (
      <td
        {...css(
          styles['calendar-day'],
          useDefaultCursor && styles['calendar-day--default-cursor'],
          styles['calendar-day--default'],
          isOutsideDay && styles['calendar-day--outside'],
          modifiers.has('today') && styles['calendar-day--today'],
          modifiers.has('first-day-of-week') && styles['calendar-day--first-day-of-week'],
          modifiers.has('last-day-of-week') && styles['calendar-day--last-day-of-week'],
          modifiers.has('hovered-offset') && styles['calendar-day--hovered-offset'],
          modifiers.has('highlighted-calendar') && styles['calendar-day--highlighted-calendar'],
          modifiers.has('blocked-minimum-nights') && styles['calendar-day--blocked-minimum-nights'],
          modifiers.has('blocked-calendar') && styles['calendar-day--blocked-calendar'],
          hoveredSpan && styles['calendar-day--hovered-span'],
          modifiers.has('selected-span') && styles['calendar-day--selected-span'],
          modifiers.has('last-in-range') && styles['calendar-day--last-in-range'],
          modifiers.has('selected-start') && styles['calendar-day--selected-start'],
          modifiers.has('selected-end') && styles['calendar-day--selected-end'],
          selected && styles['calendar-day--selected'],
          isOutsideRange && styles['calendar-day--blocked-out-of-range'],
          daySizeStyles,
        )}
        role="button" // eslint-disable-line jsx-a11y/no-noninteractive-element-to-interactive-role
        ref={this.setButtonRef}
        aria-label={ariaLabel}
        onMouseEnter={(e) => { this.onDayMouseEnter(day, e); }}
        onMouseLeave={(e) => { this.onDayMouseLeave(day, e); }}
        onMouseUp={(e) => { e.currentTarget.blur(); }}
        onClick={(e) => { this.onDayClick(day, e); }}
        onKeyDown={(e) => { this.onKeyDown(day, e); }}
        tabIndex={tabIndex}
      >
        {renderDayContents ? renderDayContents(day, modifiers) : day.format('D')}
      </td>
    );
  }
}

CalendarDay.propTypes = propTypes;
CalendarDay.defaultProps = defaultProps;

export { CalendarDay as PureCalendarDay };
export default withStyles(({ reactDates: { color, font } }) => ({
  'calendar-day': {
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontSize: font.size,
    textAlign: 'center',

    ':active': {
      outline: 0,
    },
  },

  'calendar-day--default-cursor': {
    cursor: 'default',
  },

  'calendar-day--default': {
    border: `1px solid ${color.core.borderLight}`,
    color: color.text,
    background: color.background,

    ':hover': {
      background: color.core.borderLight,
      border: `1px double ${color.core.borderLight}`,
      color: 'inherit',
    },
  },

  'calendar-day--hovered-offset': {
    background: color.core.borderBright,
    border: `1px double ${color.core.borderLight}`,
    color: 'inherit',
  },

  'calendar-day--outside': {
    border: 0,
    background: color.outside.backgroundColor,
    color: color.outside.color,

    ':hover': {
      border: 0,
    },
  },

  'calendar-day--blocked-minimum-nights': {
    background: color.minimumNights.backgroundColor,
    border: `1px solid ${color.minimumNights.borderColor}`,
    color: color.minimumNights.color,

    ':hover': {
      background: color.minimumNights.backgroundColor_hover,
      color: color.minimumNights.color_active,
    },

    ':active': {
      background: color.minimumNights.backgroundColor_active,
      color: color.minimumNights.color_active,
    },
  },

  'calendar-day--highlighted-calendar': {
    background: color.highlighted.backgroundColor,
    color: color.highlighted.color,

    ':hover': {
      background: color.highlighted.backgroundColor_hover,
      color: color.highlighted.color_active,
    },

    ':active': {
      background: color.highlighted.backgroundColor_active,
      color: color.highlighted.color_active,
    },
  },

  'calendar-day--selected-span': {
    background: color.selectedSpan.backgroundColor,
    border: `1px solid ${color.selectedSpan.borderColor}`,
    color: color.selectedSpan.color,

    ':hover': {
      background: color.selectedSpan.backgroundColor_hover,
      border: `1px solid ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },

    ':active': {
      background: color.selectedSpan.backgroundColor_active,
      border: `1px solid ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },
  },

  'calendar-day--last-in-range': {
    borderRight: color.core.primary,
  },

  'calendar-day--selected': {
    background: color.selected.backgroundColor,
    border: `1px solid ${color.selected.borderColor}`,
    color: color.selected.color,

    ':hover': {
      background: color.selected.backgroundColor_hover,
      border: `1px solid ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },

    ':active': {
      background: color.selected.backgroundColor_active,
      border: `1px solid ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },
  },

  'calendar-day--hovered-span': {
    background: color.hoveredSpan.backgroundColor,
    border: `1px solid ${color.hoveredSpan.borderColor}`,
    color: color.hoveredSpan.color,

    ':hover': {
      background: color.hoveredSpan.backgroundColor_hover,
      border: `1px solid ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },

    ':active': {
      background: color.hoveredSpan.backgroundColor_active,
      border: `1px solid ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },
  },

  'calendar-day--blocked-calendar': {
    background: color.blocked_calendar.backgroundColor,
    border: `1px solid ${color.blocked_calendar.borderColor}`,
    color: color.blocked_calendar.color,

    ':hover': {
      background: color.blocked_calendar.backgroundColor_hover,
      border: `1px solid ${color.blocked_calendar.borderColor}`,
      color: color.blocked_calendar.color_active,
    },

    ':active': {
      background: color.blocked_calendar.backgroundColor_active,
      border: `1px solid ${color.blocked_calendar.borderColor}`,
      color: color.blocked_calendar.color_active,
    },
  },

  'calendar-day--blocked-out-of-range': {
    background: color.blocked_out_of_range.backgroundColor,
    border: `1px solid ${color.blocked_out_of_range.borderColor}`,
    color: color.blocked_out_of_range.color,

    ':hover': {
      background: color.blocked_out_of_range.backgroundColor_hover,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },

    ':active': {
      background: color.blocked_out_of_range.backgroundColor_active,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },
  },

  'calendar-day--selected-start': {},
  'calendar-day--selected-end': {},
  'calendar-day--today': {},
  'calendar-day--first-day-of-week': {},
  'calendar-day--last-day-of-week': {},
}))(CalendarDay);
