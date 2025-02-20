/**
 * Created by haywoodfu on 17/4/16.
 */

import {
  View,
  Text,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet
} from 'react-native'
import React, { Component } from 'react'

import PropTypes from 'prop-types'
import Theme from './Theme'

const {cancelButtonWidth: buttonWidth, searchBarHorizontalPadding, searchIconWidth} = Theme.size

export default class SearchBar extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    onChange: PropTypes.func, // search input value changed callback,

    onFocus: PropTypes.func, // search input focused callback
    onBlur: PropTypes.func, // search input blured callback

    onClickCancel: PropTypes.func, // the search cancel button clicked
    cancelTitle: PropTypes.string, // title for the search cancel button
    cancelTextColor: PropTypes.string, // color for the search cancel button

    searchInputBackgroundColor: PropTypes.string, // default state background color for the search input
    searchInputBackgroundColorActive: PropTypes.string, // active state background color for the search input
    searchInputPlaceholderColor: PropTypes.string, // default placeholder color for the search input
    searchInputTextColor: PropTypes.string, // default state text color for the search input
    searchInputTextColorActive: PropTypes.string, // active state text color for the search input

    searchBarBackgroundColor: PropTypes.string, // active state background color for the search bar

    isShowHolder: PropTypes.bool // 是否显示搜索图标
  }

  static defaultProps = {
    searchInputBackgroundColor: '#FFF',
    searchInputBackgroundColorActive: '#171a23',

    searchInputPlaceholderColor: '#979797',
    searchInputTextColor: '#171a23',
    searchInputTextColorActive: '#FFF',

    searchBarBackgroundColor: '#171a23',

    cancelTextColor: 'white',
    cancelTitle: 'Cancel'
  }

  constructor (props) {
    super(props)
    this.state = {
      value: props.value || '',
      isShowHolder: true,
      animatedValue: new Animated.Value(0)
    }
    this._isMounted = false;
    this.animation = null;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.animation) {
      this.animation.stop();
    }
  }

  onChange (str) {
    if (!this._isMounted) return;
    this.props.onChange && this.props.onChange(str)
    this.setState({ value: str })
  }

  onBlur () {
    if (!this._isMounted) return;
    this.props.onBlur && this.props.onBlur()
  }

  onFocus () {
    if (!this._isMounted) return;
    this.props.onFocus && this.props.onFocus()
    this.searchingAnimation(true)
  }

  searchingAnimation (isSearching) {
    if (!this._isMounted) return;
    
    let toVal = 0

    if (isSearching) {
      this.state.animatedValue.setValue(0)
      toVal = buttonWidth
    } else {
      this.state.animatedValue.setValue(buttonWidth)
      toVal = 0
    }

    if (this.animation) {
      this.animation.stop();
    }

    this.animation = Animated.timing(this.state.animatedValue, {
      duration: Theme.duration.toggleSearchBar,
      toValue: toVal,
      useNativeDriver: true
    });

    this.animation.start(() => {
      if (this._isMounted) {
        this.setState({isShowHolder: !isSearching})
      }
    })
  }

  cancelSearch () {
    if (!this._isMounted) return;
    if (this.refs.input) {
      this.refs.input.clear()
      this.refs.input.blur()
    }
    this.onChange('')
    this.searchingAnimation(false)
    this.props.onClickCancel && this.props.onClickCancel()
  }

  render () {
    return (
      <View style={[styles.container, { backgroundColor: this.props.searchBarBackgroundColor }]}>
        <View style={styles.searchSection}>
          <View style={[styles.searchInputWrapper, { backgroundColor: this.props.searchInputBackgroundColor }]}>
            {this.state.isShowHolder && (
              <Image source={require('../images/icon-search.png')} style={styles.searchIcon} />
            )}
            <TextInput
              ref='input'
              style={[styles.searchTextInput, {
                backgroundColor: this.props.searchInputBackgroundColor,
                color: this.state.isShowHolder ? this.props.searchInputTextColor : this.props.searchInputTextColorActive
              }]}
              onChangeText={this.onChange.bind(this)}
              value={this.state.value}
              autoCorrect={false}
              placeholder={this.props.placeholder}
              placeholderTextColor={this.props.searchInputPlaceholderColor}
              onFocus={this.onFocus.bind(this)}
              onBlur={this.onBlur.bind(this)}
            />
          </View>
          <TouchableWithoutFeedback onPress={this.cancelSearch.bind(this)}>
            <Animated.View style={[styles.cancelButton, {
              transform: [{
                translateX: this.state.animatedValue.interpolate({
                  inputRange: [0, buttonWidth],
                  outputRange: [buttonWidth, 0]
                })
              }]
            }]}>
              <Text style={[styles.cancelButtonText, { color: this.props.cancelTextColor }]}>
                {this.props.cancelTitle}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: searchBarHorizontalPadding,
    height: Theme.size.searchInputHeight,
    justifyContent: 'center'
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchInputWrapper: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
    tintColor: '#666'
  },
  searchTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    padding: 0
  },
  cancelButton: {
    paddingLeft: 16,
    height: '100%',
    justifyContent: 'center'
  },
  cancelButtonText: {
    fontSize: 16
  }
})
