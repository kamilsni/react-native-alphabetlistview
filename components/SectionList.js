'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactNative, {
  StyleSheet,
  View,
  Text,
} from 'react-native';

const noop = () => {};
const returnTrue = () => true;

export default class SectionList extends Component {

  constructor(props, context) {
    super(props, context);

    this.onSectionSelect = this.onSectionSelect.bind(this);
    this.resetSection = this.resetSection.bind(this);
    this.detectAndScrollToSection = this.detectAndScrollToSection.bind(this);
    let lastSelectedIndex = null;

    Object.defineProperty(this, 'lastSelectedIndex', {
      set(val) {
        const nextState = { lastSelectedIndex: val };

        if (!val) {
          nextState.evtY = 0;
        }

        this.setState(nextState);
        lastSelectedIndex = val;
      },
      get() {
        return lastSelectedIndex;
      }
    });

    this.state = {
      lastSelectedIndex: null,
      evtY: 0,
    }
  }

  onSectionSelect(sectionId, fromTouch) {
    this.props.onSectionSelect && this.props.onSectionSelect(sectionId);

    if (!fromTouch) {
      this.lastSelectedIndex = null;
    }
  }

  resetSection() {
    this.lastSelectedIndex = null;
  }

  detectAndScrollToSection({ nativeEvent }) {
    const ev = nativeEvent.touches[0];
    const { y, width, height } = this.measure;
    const targetY = ev.pageY - y;
    const index = (Math.floor(targetY / height));

    if (index >= this.props.sections.length || index < 0) {
      return;
    }

    if (this.lastSelectedIndex !== index && this.props.data[this.props.sections[index]].length) {
      this.lastSelectedIndex = index;
      this.onSectionSelect(this.props.sections[index], true);
    }

    this.setState({
      evtY: Math.round(targetY),
    });
  }

  fixSectionItemMeasure() {
    const sectionItem = this.refs.sectionItem0;

    if (!sectionItem) {
      return;
    }

    this.measureTimer = setTimeout(() => {
      sectionItem.measure((x, y, width, height, pageX, pageY) => {
        this.measure = {
          y: pageY,
          width,
          height
        };
      })
    }, 0);
  }

  componentDidMount() {
    this.fixSectionItemMeasure();
  }

  // fix bug when change data
  componentDidUpdate() {
    this.fixSectionItemMeasure();
  }

  componentWillUnmount() {
    this.measureTimer && clearTimeout(this.measureTimer);
  }

  renderLetterLabel() {
    if (!this.props.showLetter || this.lastSelectedIndex === null) {
      return null;
    }

    const labelStyle = [
      styles.letter_label,
      {
        backgroundColor: this.props.mainColor,
        top: this.state.evtY - ((this.props.letterLabelStyle.height || styles.letter_label.height) / 2),
      },
      this.props.letterLabelStyle,
    ];

    const textFontSize = Math.round(Math.min(this.props.letterLabelStyle.width || styles.letter_label.width, this.props.letterLabelStyle.height || styles.letter_label.height) * 0.7);

    const textStyle = [
      styles.letter_label_text,
      {
        color: this.props.reversedColor,
        fontSize: textFontSize,
      },
      this.props.letterLabelFontStyle,
    ];

    return (
      <View style={labelStyle}>
        <Text style={textStyle} {...this.props.letterLabelTextProps}>{this.renderLetterLabelText()}</Text>
      </View>
    )
  }

  renderLetterLabelText() {
    const section = this.props.sections[this.lastSelectedIndex];

    return (
      this.props.renderLetterLabelText
        ? this.props.renderLetterLabelText(section)
          : this.props.getSectionListTitle
            ? this.props.getSectionListTitle(section)
            : section
    );
  }

  renderSections() {
    const SectionComponent = this.props.component;

    return (
      <React.Fragment>
        {
          this.props.sections.map((section, index) => {
            const title = this.props.getSectionListTitle ?
              this.props.getSectionListTitle(section) :
              section;

            const textStyle = this.props.data[section].length ?
              styles.text :
              styles.inactivetext;

            const child = SectionComponent ?
              <SectionComponent
                sectionId={section}
                title={title}
              /> :
              <View
                style={styles.item}>
                <Text style={[textStyle, { color: this.props.mainColor }, this.props.fontStyle]} {...this.props.azSideBarProps}>{title}</Text>
              </View>;

            return (
              <View key={index} ref={'sectionItem' + index} pointerEvents="none">
                {child}
              </View>
            );
          })
        }
      </React.Fragment>
    )
  }

  render() {
    return (
      <View style={[styles.wrapper, this.props.wrapperStyle]}>
        <View ref="view" style={[styles.container, this.props.style]}
          onStartShouldSetResponder={returnTrue}
          onMoveShouldSetResponder={returnTrue}
          onResponderGrant={this.detectAndScrollToSection}
          onResponderMove={this.detectAndScrollToSection}
          onResponderRelease={this.resetSection}
        >
          {this.renderLetterLabel()}
          {this.renderSections()}
        </View>
      </View>
    );
  }
}

SectionList.propTypes = {

  /**
   * A component to render for each section item
   */
  component: PropTypes.func,

  /**
   * Function to provide a title the section list items.
   */
  getSectionListTitle: PropTypes.func,

  /**
   * Function to be called upon selecting a section list item
   */
  onSectionSelect: PropTypes.func,

  /**
   * The sections to render
   */
  sections: PropTypes.array.isRequired,

  /**
   * A style to apply to the section list container
   */
  style: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
  ]),

  /**
   * Text font size
   */
  fontStyle: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
  ]),
  
  /**
   * An object containing additional props, which will be passed
   * to AZ sidebar letters.
   */
  azSideBarProps: PropTypes.object,
  
  /**
   * An object containing additional props, which will be passed
   * to AZ letter Label.
   */
  letterLabelTextProps: PropTypes.object,

  /**
   * For documentation of the following props, please refer to
   * SelectableSectionsListView.propTypes
   */
  showLetter: PropTypes.bool,
  letterLabelStyle: PropTypes.any,
  letterLabelFontStyle: PropTypes.any,
  mainColor: PropTypes.string,
  reversedColor: PropTypes.string,
  renderLetterLabelText: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    backgroundColor: 'transparent',
    alignItems:'flex-end',
    justifyContent:'flex-start',
    right: 5,
    top: 0,
    bottom: 0
  },

  container: {
    minWidth: 20,
    backgroundColor: 'rgba(0,0,0,0)',
  },

  item: {
    padding: 0
  },

  text: {
    fontWeight: '700',
    paddingHorizontal: 5,
    textAlign: 'center',
  },

  inactivetext: {
    fontWeight: '700',
    paddingHorizontal: 5,
    textAlign: 'center',
    color: '#CCCCCC'
  },

  letter_label: {
    width: 70,
    height: 70,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    right: 30,
  },

  letter_label_text: {
    textAlign: 'center',
  }
});
