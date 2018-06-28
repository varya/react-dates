import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

import { DayPickerNavigationPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import LeftArrow from './LeftArrow';
import RightArrow from './RightArrow';
import ChevronUp from './ChevronUp';
import ChevronDown from './ChevronDown';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
} from '../constants';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  orientation: ScrollableOrientationShape,

  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,

  // internationalization
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerNavigationPhrases)),

  isRTL: PropTypes.bool,
});

const defaultProps = {
  navPrev: null,
  navNext: null,
  orientation: HORIZONTAL_ORIENTATION,

  onPrevMonthClick() {},
  onNextMonthClick() {},

  // internationalization
  phrases: DayPickerNavigationPhrases,
  isRTL: false,
};

function DayPickerNavigation({
  navPrev,
  navNext,
  onPrevMonthClick,
  onNextMonthClick,
  orientation,
  phrases,
  isRTL,
  styles,
}) {
  const isHorizontal = orientation === HORIZONTAL_ORIENTATION;
  const isVertical = orientation !== HORIZONTAL_ORIENTATION;
  const isVerticalScrollable = orientation === VERTICAL_SCROLLABLE;

  let navPrevIcon = navPrev;
  let navNextIcon = navNext;
  let isDefaultNavPrev = false;
  let isDefaultNavNext = false;
  if (!navPrevIcon) {
    isDefaultNavPrev = true;
    let Icon = isVertical ? ChevronUp : LeftArrow;
    if (isRTL && !isVertical) {
      Icon = RightArrow;
    }
    navPrevIcon = (
      <Icon
        {...css(
          isHorizontal && styles['daypicker-navigation__svg--horizontal'],
          isVertical && styles['daypicker-navigation__svg--vertical'],
        )}
      />
    );
  }

  if (!navNextIcon) {
    isDefaultNavNext = true;
    let Icon = isVertical ? ChevronDown : RightArrow;
    if (isRTL && !isVertical) {
      Icon = LeftArrow;
    }
    navNextIcon = (
      <Icon
        {...css(
          isHorizontal && styles['daypicker-navigation__svg--horizontal'],
          isVertical && styles['daypicker-navigation__svg--vertical'],
        )}
      />
    );
  }

  const isDefaultNav =
    isVerticalScrollable ? isDefaultNavNext : (isDefaultNavNext || isDefaultNavPrev);

  return (
    <div
      {...css(
        styles['daypicker-navigation'],
        isHorizontal && styles['daypicker-navigation--horizontal'],
        ...isVertical && [
          styles['daypicker-navigation--vertical'],
          isDefaultNav && styles['daypicker-navigation--vertical-default'],
        ],
        ...isVerticalScrollable && [
          styles['daypicker-navigation--vertical-scrollable'],
          isDefaultNav && styles['daypicker-navigation--vertical-scrollable-default'],
        ],
      )}
    >
      {!isVerticalScrollable && (
        <button
          {...css(
            styles['daypicker-navigation__button'],
            isDefaultNavPrev && styles['daypicker-navigation__button--default'],
            ...(isHorizontal && [
              styles['daypicker-navigation__button--horizontal'],
              ...isDefaultNavPrev && [
                styles['daypicker-navigation__button--horizontal-default'],
                !isRTL && styles['daypicker-navigation__left-button--horizontal-default'],
                isRTL && styles['daypicker-navigation__right-button--horizontal-default'],
              ],
            ]),
            ...(isVertical && [
              styles['daypicker-navigation__button--vertical'],
              ...isDefaultNavPrev && [
                styles['daypicker-navigation__button--vertical-default'],
                styles['daypicker-navigation__prev-button--vertical-default'],
              ],
            ]),
          )}
          type="button"
          aria-label={phrases.jumpToPrevMonth}
          onClick={onPrevMonthClick}
          onMouseUp={(e) => {
            e.currentTarget.blur();
          }}
        >
          {navPrevIcon}
        </button>
      )}

      <button
        {...css(
          styles['daypicker-navigation__button'],
          isDefaultNavNext && styles['daypicker-navigation__button--default'],
          ...(isHorizontal && [
            styles['daypicker-navigation__button--horizontal'],
            ...isDefaultNavNext && [
              styles['daypicker-navigation__button--horizontal-default'],
              isRTL && styles['daypicker-navigation__left-button--horizontal-default'],
              !isRTL && styles['daypicker-navigation__right-button--horizontal-default'],
            ],
          ]),
          ...(isVertical && [
            styles['daypicker-navigation__button--vertical'],
            styles['daypicker-navigation__next-button--vertical'],
            ...isDefaultNavNext && [
              styles['daypicker-navigation__button--vertical-default'],
              styles['daypicker-navigation__next-button--vertical-default'],
              isVerticalScrollable &&
                styles['daypicker-navigation__next-button--vertical-scrollable-default'],
            ],
          ]),
        )}
        type="button"
        aria-label={phrases.jumpToNextMonth}
        onClick={onNextMonthClick}
        onMouseUp={(e) => {
          e.currentTarget.blur();
        }}
      >
        {navNextIcon}
      </button>
    </div>
  );
}

DayPickerNavigation.propTypes = propTypes;
DayPickerNavigation.defaultProps = defaultProps;

export default withStyles(({ reactDates: { color, zIndex } }) => ({
  'daypicker-navigation': {
    position: 'relative',
    zIndex: zIndex + 2,
  },

  'daypicker-navigation--horizontal': {},
  'daypicker-navigation--vertical': {},
  'daypicker-navigation--vertical-scrollable': {},

  'daypicker-navigation--vertical-default': {
    position: 'absolute',
    width: '100%',
    height: 52,
    bottom: 0,
    left: 0,
  },

  'daypicker-navigation--vertical-scrollable-default': {
    position: 'relative',
  },

  'daypicker-navigation__button': {
    cursor: 'pointer',
    userSelect: 'none',
    border: 0,
    padding: 0,
    margin: 0,
  },

  'daypicker-navigation__button--default': {
    border: `1px solid ${color.core.borderLight}`,
    backgroundColor: color.background,
    color: color.placeholderText,

    ':focus': {
      border: `1px solid ${color.core.borderMedium}`,
    },

    ':hover': {
      border: `1px solid ${color.core.borderMedium}`,
    },

    ':active': {
      background: color.backgroundDark,
    },
  },

  'daypicker-navigation__button--horizontal': {
  },

  'daypicker-navigation__button--horizontal-default': {
    position: 'absolute',
    top: 18,
    lineHeight: 0.78,
    borderRadius: 3,
    padding: '6px 9px',
  },

  'daypicker-navigation__left-button--horizontal-default': {
    left: 22,
  },

  'daypicker-navigation__right-button--horizontal-default': {
    right: 22,
  },

  'daypicker-navigation__button--vertical': {
  },

  'daypicker-navigation__button--vertical-default': {
    padding: 5,
    background: color.background,
    boxShadow: '0 0 5px 2px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    display: 'inline-block',
    height: '100%',
    width: '50%',
  },

  'daypicker-navigation__prev-button--vertical-default': {
  },

  'daypicker-navigation__next-button--vertical-default': {
    borderLeft: 0,
  },

  'daypicker-navigation__next-button--vertical-scrollable-default': {
    width: '100%',
  },

  'daypicker-navigation__svg--horizontal': {
    height: 19,
    width: 19,
    fill: color.core.grayLight,
  },

  'daypicker-navigation__svg--vertical': {
    height: 42,
    width: 42,
    fill: color.text,
  },
}))(DayPickerNavigation);
