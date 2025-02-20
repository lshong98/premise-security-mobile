import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Animated,
  SectionList
} from 'react-native'
import PropTypes from 'prop-types'
import SearchBar from './components/SearchBar'
import Touchable from './utils/Touchable'
import HighlightableText from './components/HighlightableText'

class SectionIndex extends Component {
  constructor (props) {
    super(props)
    this.state = {
      sections: props.sections || [],
      containerHeight: 0,
      sectionHeight: props.sectionHeight || 24
    }
  }

  onLayout = (event) => {
    const containerHeight = event.nativeEvent.layout.height
    this.setState({
      containerHeight
    })
  }

  render () {
    const { sectionHeight, containerHeight, sections } = this.state
    if (!sections || sections.length === 0) return null;

    return (
      <Animated.View style={[styles.sectionIndexContainer]}>
        <View style={styles.sectionIndexList} onLayout={this.onLayout}>
          {sections.map((section, index) => (
            <View key={index} style={[styles.sectionIndexItem, { height: sectionHeight }]}>
              <Text style={styles.sectionIndexText}>
                {section.title}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    )
  }
}

export default class SearchList extends Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    renderRow: PropTypes.func,
    renderSectionHeader: PropTypes.func,
    onSearchStart: PropTypes.func,
    onSearchEnd: PropTypes.func,
    renderEmpty: PropTypes.func,
    renderEmptyResult: PropTypes.func,
    rowHeight: PropTypes.number,
    sectionHeaderHeight: PropTypes.number,
    searchListBackgroundColor: PropTypes.string,
    searchBarBackgroundColor: PropTypes.string,
    searchInputBackgroundColor: PropTypes.string,
    searchInputBackgroundColorActive: PropTypes.string,
    searchInputPlaceholderColor: PropTypes.string,
    searchInputTextColor: PropTypes.string,
    searchInputTextColorActive: PropTypes.string,
    cancelTitle: PropTypes.string,
    hideSectionList: PropTypes.bool
  }

  static defaultProps = {
    rowHeight: 40,
    sectionHeaderHeight: 24,
    searchListBackgroundColor: '#fff',
    searchBarBackgroundColor: '#fff',
    searchInputBackgroundColor: '#f2f2f2',
    searchInputBackgroundColorActive: '#f2f2f2',
    searchInputPlaceholderColor: '#666',
    searchInputTextColor: '#000',
    searchInputTextColorActive: '#000',
    cancelTitle: 'Cancel',
    hideSectionList: false
  }

  constructor (props) {
    super(props)
    this.state = {
      sections: [],
      isSearching: false,
      searchStr: '',
      dataSource: [],
      error: null
    }
  }

  componentDidMount () {
    try {
      if (this.props.data && Array.isArray(this.props.data)) {
        this.setState({ dataSource: this.props.data }, () => {
          this.initList(this.props.data);
        });
      }
    } catch (error) {
      console.error('Error in componentDidMount:', error);
      this.setState({ error: error.message });
    }
  }

  componentDidUpdate (prevProps) {
    try {
      if (JSON.stringify(prevProps.data) !== JSON.stringify(this.props.data)) {
        if (this.props.data && Array.isArray(this.props.data)) {
          this.setState({ dataSource: this.props.data, error: null }, () => {
            this.initList(this.props.data);
          });
        } else {
          this.setState({ 
            dataSource: [],
            sections: [],
            error: null
          });
        }
      }
    } catch (error) {
      console.error('Error in componentDidUpdate:', error);
      this.setState({ error: error.message });
    }
  }

  initList = (data) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        this.setState({ sections: [], error: null });
        return;
      }

      // Group items by first letter
      const groupedData = {};
      data.forEach(item => {
        if (item && typeof item.searchStr === 'string') {
          const firstChar = item.searchStr.charAt(0).toUpperCase();
          if (!groupedData[firstChar]) {
            groupedData[firstChar] = [];
          }
          groupedData[firstChar].push(item);
        }
      });

      // Convert to sections array and sort
      const sections = Object.keys(groupedData).sort().map(key => ({
        title: key,
        data: groupedData[key].sort((a, b) => a.searchStr.localeCompare(b.searchStr))
      }));

      this.setState({ sections, error: null });
    } catch (error) {
      console.error('Error in initList:', error);
      this.setState({ sections: [], error: error.message });
    }
  }

  renderSectionHeader = ({ section }) => {
    if (!section || typeof section.title === 'undefined') {
      console.warn('Invalid section data:', section);
      return null;
    }

    const {
      sectionHeaderHeight,
      sectionHeaderStyle,
      sectionHeaderTextStyle
    } = this.props;

    return (
      <View style={[
        styles.sectionHeader,
        sectionHeaderStyle,
        sectionHeaderHeight && { height: sectionHeaderHeight }
      ]}>
        <Text style={[styles.sectionHeaderText, sectionHeaderTextStyle]}>
          {section.title}
        </Text>
      </View>
    );
  }

  renderItem = ({ item, index, section }) => {
    if (!item || !item.searchStr || !section || !section.title) {
      console.warn('Invalid item or section:', { item, section });
      return null;
    }

    return this.props.renderRow(item, section.title, index);
  }

  handleSearch = (searchStr) => {
    try {
      if (!searchStr) {
        this.initList(this.state.dataSource);
        this.setState({
          isSearching: false,
          searchStr: '',
          error: null
        });
        this.props.onSearchEnd && this.props.onSearchEnd();
        return;
      }

      this.props.onSearchStart && this.props.onSearchStart();

      // Case-insensitive search
      const searchStrLower = searchStr.toLowerCase().trim();
      
      // Filter data that contains the search string
      const filteredData = this.state.dataSource.filter(item => {
        if (!item || !item.searchStr) return false;
        return item.searchStr.toLowerCase().includes(searchStrLower);
      });

      if (filteredData.length === 0) {
        this.setState({
          sections: [],
          isSearching: true,
          searchStr,
          error: null
        });
        return;
      }

      // Add highlighting information
      const highlightedData = filteredData.map(item => ({
        ...item,
        matcher: {
          matches: [{
            start: item.searchStr.toLowerCase().indexOf(searchStrLower),
            end: item.searchStr.toLowerCase().indexOf(searchStrLower) + searchStr.length
          }]
        }
      }));

      // Group filtered results into sections
      const groupedData = {};
      highlightedData.forEach(item => {
        const firstChar = item.searchStr.charAt(0).toUpperCase();
        if (!groupedData[firstChar]) {
          groupedData[firstChar] = [];
        }
        groupedData[firstChar].push(item);
      });

      const sections = Object.keys(groupedData).sort().map(key => ({
        title: key,
        data: groupedData[key].sort((a, b) => a.searchStr.localeCompare(b.searchStr))
      }));

      this.setState({
        sections,
        isSearching: true,
        searchStr,
        error: null
      });
    } catch (error) {
      console.error('Error in handleSearch:', error);
      this.setState({
        sections: [],
        isSearching: false,
        error: error.message
      });
    }
  }

  render () {
    const { searchListBackgroundColor, hideSectionList } = this.props;
    const { sections, error } = this.state;

    if (error) {
      return (
        <View style={[styles.listContainer, { backgroundColor: searchListBackgroundColor }]}>
          <SearchBar
            {...this.props}
            onChange={this.handleSearch}
            style={styles.searchBar}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        </View>
      );
    }

    const validSections = sections?.filter(section => 
      section && typeof section.title !== 'undefined' && Array.isArray(section.data)
    ) || [];

    return (
      <View style={[styles.listContainer, { backgroundColor: searchListBackgroundColor }]}>
        <SearchBar
          {...this.props}
          onChange={this.handleSearch}
          style={styles.searchBar}
        />
        <View style={styles.listContent}>
          {validSections.length > 0 ? (
            <SectionList
              style={styles.sectionList}
              sections={validSections}
              renderItem={this.renderItem}
              renderSectionHeader={this.renderSectionHeader}
              keyExtractor={(item, index) => `${item?.searchStr || 'item'}-${index}`}
              stickySectionHeadersEnabled={true}
              contentContainerStyle={styles.sectionListContent}
            />
          ) : this.state.isSearching && this.props.renderEmptyResult ? (
            this.props.renderEmptyResult(this.state.searchStr)
          ) : this.props.renderEmpty ? (
            this.props.renderEmpty()
          ) : null}
          {!hideSectionList && !this.state.isSearching && validSections.length > 0 && (
            <SectionIndex
              sections={validSections}
              sectionHeight={this.props.sectionHeaderHeight}
            />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff'
  },
  listContainer: {
    flex: 1,
    width: '100%'
  },
  searchBarContainer: {
    width: '100%'
  },
  searchBar: {
    width: '100%'
  },
  listContent: {
    flex: 1,
    width: '100%'
  },
  sectionList: {
    flex: 1,
    width: '100%'
  },
  sectionListContent: {
    width: '100%'
  },
  sectionHeader: {
    height: 24,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    width: '100%'
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666'
  },
  row: {
    height: 40,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: '100%'
  },
  rowTitle: {
    fontSize: 16,
    color: '#000'
  },
  sectionIndexContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionIndexList: {
    backgroundColor: 'transparent'
  },
  sectionIndexItem: {
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionIndexText: {
    fontSize: 12,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center'
  }
})
