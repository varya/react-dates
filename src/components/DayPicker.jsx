import React from 'react';
import PropTypes from 'prop-types';
import shallowCompare from 'react-addons-shallow-compare';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

import moment from 'moment';
import throttle from 'lodash/throttle';
import isTouchDevice from 'is-touch-device';
import OutsideClickHandler from 'react-outside-click-handler';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import CalendarMonthGrid from './CalendarMonthGrid';
import DayPickerNavigation from './DayPickerNavigation';
import DayPickerKeyboardShortcuts, {
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_RIGHT,
} from './DayPickerKeyboardShortcuts';

import getNumberOfCalendarMonthWeeks from '../utils/getNumberOfCalendarMonthWeeks';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import calculateDimension from '../utils/calculateDimension';
import getActiveElement from '../utils/getActiveElement';
import isDayVisible from '../utils/isDayVisible';

import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  INFO_POSITION_TOP,
  INFO_POSITION_BOTTOM,
  INFO_POSITION_BEFORE,
  INFO_POSITION_AFTER,
  MODIFIER_KEY_NAMES,
} from '../constants';

const MONTH_PADDING = 23;
const DAY_PICKER_PADDING = 9;
const PREV_TRANSITION = 'prev';
const NEXT_TRANSITION = 'next';
const MONTH_SELECTION_TRANSITION = 'month_selection';
const YEAR_SELECTION_TRANSITION = 'year_selection';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,

  // calendar presentation props
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  onOutsideClick: PropTypes.func,
  hidden: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: DayOfWeekShape,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape,
  hideKeyboardShortcutsPanel: PropTypes.bool,
  daySize: nonNegativeInteger,
  isRTL: PropTypes.bool,
  verticalHeight: nonNegativeInteger,
  noBorder: PropTypes.bool,
  transitionDuration: nonNegativeInteger,
  verticalBorderSpacing: nonNegativeInteger,

  // navigation props
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  noNavButtons: PropTypes.bool,
  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onMonthChange: PropTypes.func,
  onYearChange: PropTypes.func,
  onMultiplyScrollableMonths: PropTypes.func, // VERTICAL_SCROLLABLE daypickers only

  // month props
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),

  // day props
  modifiers: PropTypes.object,
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,

  // accessibility props
  isFocused: PropTypes.bool,
  getFirstFocusableDay: PropTypes.func,
  onBlur: PropTypes.func,
  showKeyboardShortcuts: PropTypes.bool,

  // internationalization
  monthFormat: PropTypes.string,
  weekDayFormat: PropTypes.string,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
  dayAriaLabelFormat: PropTypes.string,
});

export const defaultProps = {
  // calendar presentation props
  enableOutsideDays: false,
  numberOfMonths: 2,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  onOutsideClick() {},
  hidden: false,
  initialVisibleMonth: () => moment(),
  firstDayOfWeek: null,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  hideKeyboardShortcutsPanel: false,
  daySize: DAY_SIZE,
  isRTL: false,
  verticalHeight: null,
  noBorder: false,
  transitionDuration: undefined,
  verticalBorderSpacing: undefined,

  // navigation props
  navPrev: null,
  navNext: null,
  noNavButtons: false,
  onPrevMonthClick() {},
  onNextMonthClick() {},
  onMonthChange() {},
  onYearChange() {},
  onMultiplyScrollableMonths() {},

  // month props
  renderMonthText: null,
  renderMonthElement: null,

  // day props
  modifiers: {},
  renderCalendarDay: undefined,
  renderDayContents: null,
  onDayClick() {},
  onDayMouseEnter() {},
  onDayMouseLeave() {},

  // accessibility props
  isFocused: false,
  getFirstFocusableDay: null,
  onBlur() {},
  showKeyboardShortcuts: false,

  // internationalization
  monthFormat: 'MMMM YYYY',
  weekDayFormat: 'dd',
  phrases: DayPickerPhrases,
  dayAriaLabelFormat: undefined,
};

class DayPicker extends React.Component {
  constructor(props) {
    super(props);

    const currentMonth = props.hidden ? moment() : props.initialVisibleMonth();

    let focusedDate = currentMonth.clone().startOf('month');
    if (props.getFirstFocusableDay) {
      focusedDate = props.getFirstFocusableDay(currentMonth);
    }

    const translationValue = props.isRTL && this.isHorizontal()
      ? -getCalendarMonthWidth(props.daySize)
      : 0;

    this.hasSetInitialVisibleMonth = !props.hidden;
    this.state = {
      currentMonth,
      monthTransition: null,
      translationValue,
      scrollableMonthMultiple: 1,
      calendarMonthWidth: getCalendarMonthWidth(props.daySize),
      focusedDate: (!props.hidden || props.isFocused) ? focusedDate : null,
      nextFocusedDate: null,
      showKeyboardShortcuts: props.showKeyboardShortcuts,
      onKeyboardShortcutsPanelClose() {},
      isTouchDevice: isTouchDevice(),
      withMouseInteractions: true,
      calendarInfoWidth: 0,
      monthTitleHeight: null,
      hasSetHeight: false,
    };

    this.setCalendarMonthWeeks(currentMonth);

    this.calendarMonthGridHeight = 0;
    this.setCalendarInfoWidthTimeout = null;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.throttledKeyDown = throttle(this.onFinalKeyDown, 200, { trailing: false });
    this.onPrevMonthClick = this.onPrevMonthClick.bind(this);
    this.onNextMonthClick = this.onNextMonthClick.bind(this);
    this.onMonthChange = this.onMonthChange.bind(this);
    this.onYearChange = this.onYearChange.bind(this);

    this.multiplyScrollableMonths = this.multiplyScrollableMonths.bind(this);
    this.updateStateAfterMonthTransition = this.updateStateAfterMonthTransition.bind(this);

    this.openKeyboardShortcutsPanel = this.openKeyboardShortcutsPanel.bind(this);
    this.closeKeyboardShortcutsPanel = this.closeKeyboardShortcutsPanel.bind(this);

    this.setCalendarInfoRef = this.setCalendarInfoRef.bind(this);
    this.setContainerRef = this.setContainerRef.bind(this);
    this.setTransitionContainerRef = this.setTransitionContainerRef.bind(this);
    this.setMonthTitleHeight = this.setMonthTitleHeight.bind(this);
  }

  componentDidMount() {
    const { currentMonth } = this.state;
    if (this.calendarInfo) {
      this.setState({
        isTouchDevice: isTouchDevice(),
        calendarInfoWidth: calculateDimension(this.calendarInfo, 'width', true, true),
      });
    } else {
      this.setState({ isTouchDevice: isTouchDevice() });
    }

    this.setCalendarMonthWeeks(currentMonth);
  }

  componentWillReceiveProps(nextProps) {
    const {
      hidden,
      isFocused,
      showKeyboardShortcuts,
      onBlur,
      renderMonthText,
    } = nextProps;
    const { currentMonth } = this.state;

    if (!hidden) {
      if (!this.hasSetInitialVisibleMonth) {
        this.hasSetInitialVisibleMonth = true;
        this.setState({
          currentMonth: nextProps.initialVisibleMonth(),
        });
      }
    }

    if (nextProps.daySize !== this.props.daySize) {
      this.setState({
        calendarMonthWidth: getCalendarMonthWidth(nextProps.daySize),
      });
    }

    if (isFocused !== this.props.isFocused) {
      if (isFocused) {
        const focusedDate = this.getFocusedDay(currentMonth);

        let { onKeyboardShortcutsPanelClose } = this.state;
        if (nextProps.showKeyboardShortcuts) {
          // the ? shortcut came from the input and we should return input there once it is close
          onKeyboardShortcutsPanelClose = onBlur;
        }

        this.setState({
          showKeyboardShortcuts,
          onKeyboardShortcutsPanelClose,
          focusedDate,
          withMouseInteractions: false,
        });
      } else {
        this.setState({ focusedDate: null });
      }
    }

    if (renderMonthText !== this.props.renderMonthText) {
      this.setState({
        monthTitleHeight: null,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  componentWillUpdate() {
    const { transitionDuration } = this.props;

    // Calculating the dimensions trigger a DOM repaint which
    // breaks the CSS transition.
    // The setTimeout will wait until the transition ends.
    if (this.calendarInfo) {
      this.setCalendarInfoWidthTimeout = setTimeout(() => {
        const { calendarInfoWidth } = this.state;
        const calendarInfoPanelWidth = calculateDimension(this.calendarInfo, 'width', true, true);
        if (calendarInfoWidth !== calendarInfoPanelWidth) {
          this.setState({
            calendarInfoWidth: calendarInfoPanelWidth,
          });
        }
      }, transitionDuration);
    }
  }

  componentDidUpdate(prevProps) {
    const { isFocused } = this.props;
    const { focusedDate } = this.state;

    if (!prevProps.isFocused && isFocused && !focusedDate) {
      this.container.focus();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.setCalendarInfoWidthTimeout);
  }

  onKeyDown(e) {
    e.stopPropagation();
    if (!MODIFIER_KEY_NAMES.has(e.key)) {
      this.throttledKeyDown(e);
    }
  }

  onFinalKeyDown(e) {
    this.setState({ withMouseInteractions: false });

    const { onBlur, isRTL } = this.props;
    const { focusedDate, showKeyboardShortcuts } = this.state;
    if (!focusedDate) return;

    const newFocusedDate = focusedDate.clone();

    let didTransitionMonth = false;

    // focus might be anywhere when the keyboard shortcuts panel is opened so we want to
    // return it to wherever it was before when the panel was opened
    const activeElement = getActiveElement();
    const onKeyboardShortcutsPanelClose = () => {
      if (activeElement) activeElement.focus();
    };

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newFocusedDate.subtract(1, 'week');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (isRTL) {
          newFocusedDate.add(1, 'day');
        } else {
          newFocusedDate.subtract(1, 'day');
        }
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'Home':
        e.preventDefault();
        newFocusedDate.startOf('week');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'PageUp':
        e.preventDefault();
        newFocusedDate.subtract(1, 'month');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;

      case 'ArrowDown':
        e.preventDefault();
        newFocusedDate.add(1, 'week');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (isRTL) {
          newFocusedDate.subtract(1, 'day');
        } else {
          newFocusedDate.add(1, 'day');
        }
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'End':
        e.preventDefault();
        newFocusedDate.endOf('week');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'PageDown':
        e.preventDefault();
        newFocusedDate.add(1, 'month');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;

      case '?':
        this.openKeyboardShortcutsPanel(onKeyboardShortcutsPanelClose);
        break;

      case 'Escape':
        if (showKeyboardShortcuts) {
          this.closeKeyboardShortcutsPanel();
        } else {
          onBlur();
        }
        break;

      default:
        break;
    }

    // If there was a month transition, do not update the focused date until the transition has
    // completed. Otherwise, attempting to focus on a DOM node may interrupt the CSS animation. If
    // didTransitionMonth is true, the focusedDate gets updated in #updateStateAfterMonthTransition
    if (!didTransitionMonth) {
      this.setState({
        focusedDate: newFocusedDate,
      });
    }
  }

  onPrevMonthClick(nextFocusedDate, e) {
    const { daySize, isRTL, numberOfMonths } = this.props;
    const { calendarMonthWidth, monthTitleHeight } = this.state;

    if (e) e.preventDefault();

    let translationValue;
    if (this.isVertical()) {
      const calendarMonthWeeksHeight = this.calendarMonthWeeks[0] * (daySize - 1);
      translationValue = monthTitleHeight + calendarMonthWeeksHeight + 1;
    } else if (this.isHorizontal()) {
      translationValue = calendarMonthWidth;
      if (isRTL) {
        translationValue = -2 * calendarMonthWidth;
      }

      const visibleCalendarWeeks = this.calendarMonthWeeks.slice(0, numberOfMonths);
      const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
      const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;
      this.adjustDayPickerHeight(newMonthHeight);
    }

    this.setState({
      monthTransition: PREV_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  onMonthChange(currentMonth) {
    this.setCalendarMonthWeeks(currentMonth);
    this.calculateAndSetDayPickerHeight();

    // Translation value is a hack to force an invisible transition that
    // properly rerenders the CalendarMonthGrid
    this.setState({
      monthTransition: MONTH_SELECTION_TRANSITION,
      translationValue: 0.00001,
      focusedDate: null,
      nextFocusedDate: currentMonth,
      currentMonth,
    });
  }

  onYearChange(currentMonth) {
    this.setCalendarMonthWeeks(currentMonth);
    this.calculateAndSetDayPickerHeight();

    // Translation value is a hack to force an invisible transition that
    // properly rerenders the CalendarMonthGrid
    this.setState({
      monthTransition: YEAR_SELECTION_TRANSITION,
      translationValue: 0.0001,
      focusedDate: null,
      nextFocusedDate: currentMonth,
      currentMonth,
    });
  }

  onNextMonthClick(nextFocusedDate, e) {
    const { isRTL, numberOfMonths, daySize } = this.props;
    const { calendarMonthWidth, monthTitleHeight } = this.state;

    if (e) e.preventDefault();

    let translationValue;

    if (this.isVertical()) {
      const firstVisibleMonthWeeks = this.calendarMonthWeeks[1];
      const calendarMonthWeeksHeight = firstVisibleMonthWeeks * (daySize - 1);
      translationValue = -(monthTitleHeight + calendarMonthWeeksHeight + 1);
    }

    if (this.isHorizontal()) {
      translationValue = -calendarMonthWidth;
      if (isRTL) {
        translationValue = 0;
      }

      const visibleCalendarWeeks = this.calendarMonthWeeks.slice(2, numberOfMonths + 2);
      const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
      const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;
      this.adjustDayPickerHeight(newMonthHeight);
    }

    this.setState({
      monthTransition: NEXT_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  getFirstDayOfWeek() {
    const { firstDayOfWeek } = this.props;
    if (firstDayOfWeek == null) {
      return moment.localeData().firstDayOfWeek();
    }

    return firstDayOfWeek;
  }

  getFirstVisibleIndex() {
    const { orientation } = this.props;
    const { monthTransition } = this.state;

    if (orientation === VERTICAL_SCROLLABLE) return 0;

    let firstVisibleMonthIndex = 1;
    if (monthTransition === PREV_TRANSITION) {
      firstVisibleMonthIndex -= 1;
    } else if (monthTransition === NEXT_TRANSITION) {
      firstVisibleMonthIndex += 1;
    }

    return firstVisibleMonthIndex;
  }

  getFocusedDay(newMonth) {
    const { getFirstFocusableDay, numberOfMonths } = this.props;

    let focusedDate;
    if (getFirstFocusableDay) {
      focusedDate = getFirstFocusableDay(newMonth);
    }

    if (newMonth && (!focusedDate || !isDayVisible(focusedDate, newMonth, numberOfMonths))) {
      focusedDate = newMonth.clone().startOf('month');
    }

    return focusedDate;
  }

  setMonthTitleHeight(monthTitleHeight) {
    this.setState({
      monthTitleHeight,
    }, () => {
      this.calculateAndSetDayPickerHeight();
    });
  }

  setCalendarMonthWeeks(currentMonth) {
    const { numberOfMonths } = this.props;

    this.calendarMonthWeeks = [];
    let month = currentMonth.clone().subtract(1, 'months');
    const firstDayOfWeek = this.getFirstDayOfWeek();
    for (let i = 0; i < numberOfMonths + 2; i += 1) {
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(month, firstDayOfWeek);
      this.calendarMonthWeeks.push(numberOfWeeks);
      month = month.add(1, 'months');
    }
  }

  setContainerRef(ref) {
    this.container = ref;
  }

  setCalendarInfoRef(ref) {
    this.calendarInfo = ref;
  }

  setTransitionContainerRef(ref) {
    this.transitionContainer = ref;
  }

  maybeTransitionNextMonth(newFocusedDate) {
    const { numberOfMonths } = this.props;
    const { currentMonth, focusedDate } = this.state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    const isNewFocusedDateVisible = isDayVisible(newFocusedDate, currentMonth, numberOfMonths);
    if (newFocusedDateMonth !== focusedDateMonth && !isNewFocusedDateVisible) {
      this.onNextMonthClick(newFocusedDate);
      return true;
    }

    return false;
  }

  maybeTransitionPrevMonth(newFocusedDate) {
    const { numberOfMonths } = this.props;
    const { currentMonth, focusedDate } = this.state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    const isNewFocusedDateVisible = isDayVisible(newFocusedDate, currentMonth, numberOfMonths);
    if (newFocusedDateMonth !== focusedDateMonth && !isNewFocusedDateVisible) {
      this.onPrevMonthClick(newFocusedDate);
      return true;
    }

    return false;
  }

  multiplyScrollableMonths(e) {
    const { onMultiplyScrollableMonths } = this.props;
    if (e) e.preventDefault();

    if (onMultiplyScrollableMonths) onMultiplyScrollableMonths(e);

    this.setState({
      scrollableMonthMultiple: this.state.scrollableMonthMultiple + 1,
    });
  }

  isHorizontal() {
    const { orientation } = this.props;
    return orientation === HORIZONTAL_ORIENTATION;
  }

  isVertical() {
    const { orientation } = this.props;
    return orientation === VERTICAL_ORIENTATION || orientation === VERTICAL_SCROLLABLE;
  }

  updateStateAfterMonthTransition() {
    const {
      onPrevMonthClick,
      onNextMonthClick,
      numberOfMonths,
      onMonthChange,
      onYearChange,
      isRTL,
    } = this.props;

    const {
      currentMonth,
      monthTransition,
      focusedDate,
      nextFocusedDate,
      withMouseInteractions,
      calendarMonthWidth,
    } = this.state;

    if (!monthTransition) return;

    const newMonth = currentMonth.clone();
    const firstDayOfWeek = this.getFirstDayOfWeek();
    if (monthTransition === PREV_TRANSITION) {
      newMonth.subtract(1, 'month');
      if (onPrevMonthClick) onPrevMonthClick(newMonth);
      const newInvisibleMonth = newMonth.clone().subtract(1, 'month');
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(newInvisibleMonth, firstDayOfWeek);
      this.calendarMonthWeeks = [numberOfWeeks, ...this.calendarMonthWeeks.slice(0, -1)];
    } else if (monthTransition === NEXT_TRANSITION) {
      newMonth.add(1, 'month');
      if (onNextMonthClick) onNextMonthClick(newMonth);
      const newInvisibleMonth = newMonth.clone().add(numberOfMonths, 'month');
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(newInvisibleMonth, firstDayOfWeek);
      this.calendarMonthWeeks = [...this.calendarMonthWeeks.slice(1), numberOfWeeks];
    } else if (monthTransition === MONTH_SELECTION_TRANSITION) {
      if (onMonthChange) onMonthChange(newMonth);
    } else if (monthTransition === YEAR_SELECTION_TRANSITION) {
      if (onYearChange) onYearChange(newMonth);
    }

    let newFocusedDate = null;
    if (nextFocusedDate) {
      newFocusedDate = nextFocusedDate;
    } else if (!focusedDate && !withMouseInteractions) {
      newFocusedDate = this.getFocusedDay(newMonth);
    }

    this.setState({
      currentMonth: newMonth,
      monthTransition: null,
      translationValue: (isRTL && this.isHorizontal()) ? -calendarMonthWidth : 0,
      nextFocusedDate: null,
      focusedDate: newFocusedDate,
    }, () => {
      // we don't want to focus on the relevant calendar day after a month transition
      // if the user is navigating around using a mouse
      if (withMouseInteractions) {
        const activeElement = getActiveElement();
        if (
          activeElement &&
          activeElement !== document.body &&
          this.container.contains(activeElement)
        ) {
          activeElement.blur();
        }
      }
    });
  }

  adjustDayPickerHeight(newMonthHeight) {
    const monthHeight = newMonthHeight + MONTH_PADDING;
    if (monthHeight !== this.calendarMonthGridHeight) {
      this.transitionContainer.style.height = `${monthHeight}px`;
      if (!this.calendarMonthGridHeight) {
        setTimeout(() => {
          this.setState({ hasSetHeight: true });
        }, 0);
      }
      this.calendarMonthGridHeight = monthHeight;
    }
  }

  calculateAndSetDayPickerHeight() {
    const { daySize, numberOfMonths } = this.props;
    const { monthTitleHeight } = this.state;

    const visibleCalendarWeeks = this.calendarMonthWeeks.slice(1, numberOfMonths + 1);
    const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
    const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;

    if (this.isHorizontal()) {
      this.adjustDayPickerHeight(newMonthHeight);
    }
  }

  openKeyboardShortcutsPanel(onCloseCallBack) {
    this.setState({
      showKeyboardShortcuts: true,
      onKeyboardShortcutsPanelClose: onCloseCallBack,
    });
  }

  closeKeyboardShortcutsPanel() {
    const { onKeyboardShortcutsPanelClose } = this.state;

    if (onKeyboardShortcutsPanelClose) {
      onKeyboardShortcutsPanelClose();
    }

    this.setState({
      onKeyboardShortcutsPanelClose: null,
      showKeyboardShortcuts: false,
    });
  }

  renderNavigation() {
    const {
      navPrev,
      navNext,
      noNavButtons,
      orientation,
      phrases,
      isRTL,
    } = this.props;

    if (noNavButtons) {
      return null;
    }

    let onNextMonthClick;
    if (orientation === VERTICAL_SCROLLABLE) {
      onNextMonthClick = this.multiplyScrollableMonths;
    } else {
      onNextMonthClick = (e) => { this.onNextMonthClick(null, e); };
    }

    return (
      <DayPickerNavigation
        onPrevMonthClick={(e) => { this.onPrevMonthClick(null, e); }}
        onNextMonthClick={onNextMonthClick}
        navPrev={navPrev}
        navNext={navNext}
        orientation={orientation}
        phrases={phrases}
        isRTL={isRTL}
      />
    );
  }

  renderWeekHeader(index) {
    const {
      daySize,
      orientation,
      weekDayFormat,
      styles,
    } = this.props;
    const { calendarMonthWidth } = this.state;
    const verticalScrollable = orientation === VERTICAL_SCROLLABLE;
    const horizontalStyle = {
      left: index * calendarMonthWidth,
    };
    const verticalStyle = {
      marginLeft: -calendarMonthWidth / 2,
    };

    let weekHeaderStyle = {}; // no styles applied to the vertical-scrollable orientation
    if (this.isHorizontal()) {
      weekHeaderStyle = horizontalStyle;
    } else if (this.isVertical() && !verticalScrollable) {
      weekHeaderStyle = verticalStyle;
    }

    const firstDayOfWeek = this.getFirstDayOfWeek();

    const header = [];
    for (let i = 0; i < 7; i += 1) {
      header.push((
        <li key={i} {...css(styles['daypicker__week-header-item'], { width: daySize })}>
          <small>{moment().day((i + firstDayOfWeek) % 7).format(weekDayFormat)}</small>
        </li>
      ));
    }

    return (
      <div
        {...css(
          styles['daypicker__week-header'],
          this.isVertical() && styles['daypicker__week-header--vertical'],
          verticalScrollable && styles['daypicker__week-header--vertical-scrollable'],
          weekHeaderStyle,
        )}
        key={`week-${index}`}
      >
        <ul {...css(styles['daypicker__week-header'])}>
          {header}
        </ul>
      </div>
    );
  }

  render() {
    const {
      calendarMonthWidth,
      currentMonth,
      monthTransition,
      translationValue,
      scrollableMonthMultiple,
      focusedDate,
      showKeyboardShortcuts,
      isTouchDevice: isTouch,
      hasSetHeight,
      calendarInfoWidth,
      monthTitleHeight,
    } = this.state;

    const {
      enableOutsideDays,
      numberOfMonths,
      orientation,
      modifiers,
      withPortal,
      onDayClick,
      onDayMouseEnter,
      onDayMouseLeave,
      firstDayOfWeek,
      renderMonthText,
      renderCalendarDay,
      renderDayContents,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      hideKeyboardShortcutsPanel,
      onOutsideClick,
      monthFormat,
      daySize,
      isFocused,
      isRTL,
      styles,
      phrases,
      verticalHeight,
      dayAriaLabelFormat,
      noBorder,
      transitionDuration,
      verticalBorderSpacing,
    } = this.props;

    const isHorizontal = this.isHorizontal();

    const numOfWeekHeaders = this.isVertical() ? 1 : numberOfMonths;
    const weekHeaders = [];
    for (let i = 0; i < numOfWeekHeaders; i += 1) {
      weekHeaders.push(this.renderWeekHeader(i));
    }

    const verticalScrollable = orientation === VERTICAL_SCROLLABLE;
    let height;
    if (isHorizontal) {
      height = this.calendarMonthGridHeight;
    } else if (this.isVertical() && !verticalScrollable && !withPortal) {
      // If the user doesn't set a desired height,
      // we default back to this kind of made-up value that generally looks good
      height = verticalHeight || 1.75 * calendarMonthWidth;
    }

    const isCalendarMonthGridAnimating = monthTransition !== null;

    const shouldFocusDate = !isCalendarMonthGridAnimating && isFocused;

    let keyboardShortcutButtonLocation = BOTTOM_RIGHT;
    if (this.isVertical()) {
      keyboardShortcutButtonLocation = withPortal ? TOP_LEFT : TOP_RIGHT;
    }

    const shouldAnimateHeight = isHorizontal && hasSetHeight;

    const calendarInfoPositionTop = calendarInfoPosition === INFO_POSITION_TOP;
    const calendarInfoPositionBottom = calendarInfoPosition === INFO_POSITION_BOTTOM;
    const calendarInfoPositionBefore = calendarInfoPosition === INFO_POSITION_BEFORE;
    const calendarInfoPositionAfter = calendarInfoPosition === INFO_POSITION_AFTER;
    const calendarInfoIsInline = calendarInfoPositionBefore || calendarInfoPositionAfter;

    const calendarInfo = renderCalendarInfo && (
      <div
        ref={this.setCalendarInfoRef}
        {...css((calendarInfoIsInline) && styles['daypicker__calendar-info--horizontal'])}
      >
        {renderCalendarInfo()}
      </div>
    );

    const calendarInfoPanelWidth = renderCalendarInfo && calendarInfoIsInline
      ? calendarInfoWidth
      : 0;

    const firstVisibleMonthIndex = this.getFirstVisibleIndex();
    const wrapperHorizontalWidth = (calendarMonthWidth * numberOfMonths) + (2 * DAY_PICKER_PADDING);
    // Adding `1px` because of whitespace between 2 inline-block
    const fullHorizontalWidth = wrapperHorizontalWidth + calendarInfoPanelWidth + 1;

    const transitionContainerStyle = {
      width: isHorizontal && wrapperHorizontalWidth,
      height,
    };

    const dayPickerWrapperStyle = {
      width: isHorizontal && wrapperHorizontalWidth,
    };

    const dayPickerStyle = {
      width: isHorizontal && fullHorizontalWidth,

      // These values are to center the datepicker (approximately) on the page
      marginLeft: isHorizontal && withPortal ? -fullHorizontalWidth / 2 : null,
      marginTop: isHorizontal && withPortal ? -calendarMonthWidth / 2 : null,
    };

    return (
      <div
        role="application"
        aria-label={phrases.calendarLabel}
        {...css(
          styles['daypicker'],
          isHorizontal && styles['daypicker--horizontal'],
          verticalScrollable && styles['daypicker--vertical-scrollable'],
          isHorizontal && withPortal && styles['daypicker__portal--horizontal'],
          this.isVertical() && withPortal && styles['daypicker__portal--vertical'],
          dayPickerStyle,
          !monthTitleHeight && styles['daypicker--hidden'],
          !noBorder && styles['daypicker--with-border'],
        )}
      >
        <OutsideClickHandler onOutsideClick={onOutsideClick}>
          {(calendarInfoPositionTop || calendarInfoPositionBefore) && calendarInfo}

          <div
            {...css(
              dayPickerWrapperStyle,
              calendarInfoIsInline && isHorizontal && styles['daypicker__wrapper--horizontal'],
            )}
          >

            <div
              {...css(
                styles['daypicker__week-headers'],
                isHorizontal && styles['daypicker__week-headers--horizontal'],
              )}
              aria-hidden="true"
              role="presentation"
            >
              {weekHeaders}
            </div>

            <div // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
              {...css(styles['daypicker__focus-region'])}
              ref={this.setContainerRef}
              onClick={(e) => { e.stopPropagation(); }}
              onKeyDown={this.onKeyDown}
              onMouseUp={() => { this.setState({ withMouseInteractions: true }); }}
              role="region"
              tabIndex={-1}
            >
              {!verticalScrollable && this.renderNavigation()}

              <div
                {...css(
                  styles['daypicker__transition-container'],
                  shouldAnimateHeight && styles['daypicker__transition-container--horizontal'],
                  this.isVertical() && styles['daypicker__transition-container--vertical'],
                  verticalScrollable && styles['daypicker__transition-container--vertical-scrollable'],
                  transitionContainerStyle,
                )}
                ref={this.setTransitionContainerRef}
              >
                <CalendarMonthGrid
                  setMonthTitleHeight={!monthTitleHeight ? this.setMonthTitleHeight : undefined}
                  translationValue={translationValue}
                  enableOutsideDays={enableOutsideDays}
                  firstVisibleMonthIndex={firstVisibleMonthIndex}
                  initialMonth={currentMonth}
                  isAnimating={isCalendarMonthGridAnimating}
                  modifiers={modifiers}
                  orientation={orientation}
                  numberOfMonths={numberOfMonths * scrollableMonthMultiple}
                  onDayClick={onDayClick}
                  onDayMouseEnter={onDayMouseEnter}
                  onDayMouseLeave={onDayMouseLeave}
                  onMonthChange={this.onMonthChange}
                  onYearChange={this.onYearChange}
                  renderMonthText={renderMonthText}
                  renderCalendarDay={renderCalendarDay}
                  renderDayContents={renderDayContents}
                  renderMonthElement={renderMonthElement}
                  onMonthTransitionEnd={this.updateStateAfterMonthTransition}
                  monthFormat={monthFormat}
                  daySize={daySize}
                  firstDayOfWeek={firstDayOfWeek}
                  isFocused={shouldFocusDate}
                  focusedDate={focusedDate}
                  phrases={phrases}
                  isRTL={isRTL}
                  dayAriaLabelFormat={dayAriaLabelFormat}
                  transitionDuration={transitionDuration}
                  verticalBorderSpacing={verticalBorderSpacing}
                />
                {verticalScrollable && this.renderNavigation()}
              </div>

              {!isTouch && !hideKeyboardShortcutsPanel &&
                <DayPickerKeyboardShortcuts
                  block={this.isVertical() && !withPortal}
                  buttonLocation={keyboardShortcutButtonLocation}
                  showKeyboardShortcutsPanel={showKeyboardShortcuts}
                  openKeyboardShortcutsPanel={this.openKeyboardShortcutsPanel}
                  closeKeyboardShortcutsPanel={this.closeKeyboardShortcutsPanel}
                  phrases={phrases}
                />
              }
            </div>

          </div>

          {(calendarInfoPositionBottom || calendarInfoPositionAfter) && calendarInfo}
        </OutsideClickHandler>
      </div>
    );
  }
}

DayPicker.propTypes = propTypes;
DayPicker.defaultProps = defaultProps;

export { DayPicker as PureDayPicker };
export default withStyles(({ reactDates: { color, font, zIndex } }) => ({
  'daypicker': {
    background: color.background,
    position: 'relative',
    textAlign: 'left',
  },

  'daypicker--horizontal': {
    background: color.background,
  },

  'daypicker--vertical-scrollable': {
    height: '100%',
  },

  'daypicker--hidden': {
    visibility: 'hidden',
  },

  'daypicker--with-border': {
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.07)',
    borderRadius: 3,
  },

  'daypicker__portal--horizontal': {
    boxShadow: 'none',
    position: 'absolute',
    left: '50%',
    top: '50%',
  },

  'daypicker__portal--vertical': {
    position: 'initial',
  },

  'daypicker__focus-region': {
    outline: 'none',
  },

  'daypicker__calendar-info--horizontal': {
    display: 'inline-block',
    verticalAlign: 'top',
  },

  'daypicker__wrapper--horizontal': {
    display: 'inline-block',
    verticalAlign: 'top',
  },

  'daypicker__week-headers': {
    position: 'relative',
  },

  'daypicker__week-headers--horizontal': {
    marginLeft: 9,
  },

  'daypicker__week-header': {
    color: color.placeholderText,
    position: 'absolute',
    top: 62,
    zIndex: zIndex + 2,
    padding: '0 13px',
    textAlign: 'left',
  },

  'daypicker__week-header--vertical': {
    left: '50%',
  },

  'daypicker__week-header--vertical-scrollable': {
    top: 0,
    display: 'table-row',
    borderBottom: `1px solid ${color.core.border}`,
    background: color.background,
    marginLeft: 0,
    left: 0,
    width: '100%',
    textAlign: 'center',
  },

  'daypicker__week-header': {
    listStyle: 'none',
    margin: '1px 0',
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: font.size,
  },

  'daypicker__week-header-item': {
    display: 'inline-block',
    textAlign: 'center',
  },

  'daypicker__transition-container': {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 3,
  },

  'daypicker__transition-container--horizontal': {
    transition: 'height 0.2s ease-in-out',
  },

  'daypicker__transition-container--vertical': {
    width: '100%',
  },

  'daypicker__transition-container--verticalScrollable': {
    paddingTop: 20,
    height: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    overflowY: 'scroll',
  },
}))(DayPicker);
