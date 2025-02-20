/**
 * Created by erichua on 14/01/2018.
 */
import {
  isCharacter,
  sTrim,
  containsChinese
} from './utils/utils'
import pinyin from 'js-pinyin'
import md5 from 'md5'

export default class SearchService {
  static search(searchStr, source) {
    console.log('SearchService.search - Input:', { searchStr, sourceLength: source ? source.length : 0 });
    if (!searchStr || !source || source.length === 0) {
      console.log('SearchService.search - No input or source data');
      return [];
    }

    const searchStrLower = searchStr.toLowerCase();
    let tempResult = [];
    
    source.forEach((item) => {
      if (item && item.searchStr) {
        if (item.searchStr.toLowerCase().includes(searchStrLower)) {
          const matcher = {
            matches: [{
              start: item.searchStr.toLowerCase().indexOf(searchStrLower),
              end: item.searchStr.toLowerCase().indexOf(searchStrLower) + searchStrLower.length
            }]
          };
          tempResult.push({ ...item, matcher });
        }
      }
    });

    console.log('SearchService.search - Results:', tempResult);
    return tempResult;
  }

  initializeData(data) {
    console.log('SearchService.initializeData - Input data length:', data ? data.length : 0);
    if (!data || data.length === 0) {
      console.log('SearchService.initializeData - No data to process');
      return [];
    }

    // Create a map to group items by their first letter
    const sectionMap = new Map();
    
    data.forEach(item => {
      if (item && item.searchStr) {
        const firstChar = item.searchStr.charAt(0).toUpperCase();
        if (!sectionMap.has(firstChar)) {
          sectionMap.set(firstChar, []);
        }
        sectionMap.get(firstChar).push(item);
      }
    });

    // Convert map to array of sections
    const sections = Array.from(sectionMap, ([title, sectionData]) => ({
      title,
      data: sectionData.sort((a, b) => a.searchStr.localeCompare(b.searchStr))
    }));

    // Sort sections alphabetically
    sections.sort((a, b) => a.title.localeCompare(b.title));

    console.log('SearchService.initializeData - Created sections:', sections);
    return sections;
  }

  static generateMacherInto (source, item, inputLower, transStr, charIndexer) {
    let result = {}
    Object.assign(result, item)
    if (source) {
      let matcher = {}
      matcher.matches = []
      if (source.toLowerCase().indexOf(inputLower) >= 0) {
        matcher.machStart = source.toLowerCase().indexOf(inputLower)
        matcher.machEnd = matcher.machStart + inputLower.length

        matcher.matches.push({'start': matcher.machStart, 'end': matcher.machEnd})
        result.matcher = matcher
      } else {
        if (transStr && charIndexer) {
          let inputStartIndex = transStr.indexOf(inputLower)
          if (inputStartIndex >= 0) {
            for (let i = 0; i < charIndexer.length; i++) {
              let startCharIndexer = charIndexer[i]

              if (startCharIndexer) {
                if (startCharIndexer.startIndexInTransedStr === inputStartIndex) {
                  let inputEndIndex = inputStartIndex + inputLower.length - 1
                  let find = false
                  for (let j = i; j < charIndexer.length; j++) {
                    let endCharIndexer = charIndexer[j]

                    if (inputEndIndex <= endCharIndexer.endIndexInTransedStr) {
                      find = true
                      matcher.machStart = startCharIndexer.index
                      matcher.machEnd = endCharIndexer.index + 1
                      matcher.matches.push({'start': matcher.machStart, 'end': matcher.machEnd})
                      result.matcher = matcher
                      break
                    }
                  }

                  if (find) {
                    break
                  }
                }
              }
            }
          }
        }
      }
    }

    return result
  }

  static sortResultList (searchResultList, resultSortFunc) {
    searchResultList.sort(resultSortFunc || function (a, b) {
      if (b.matcher && a.matcher) {
        if (b.matcher.machStart < a.matcher.machStart) {
          return 1
        } else if (b.matcher.machStart > a.matcher.machStart) {
          return -1
        } else {
          return 0
        }
      } else {
        return 0
      }
    })
    let searchResultWithSection = {'': ''}
    const rowIds = [[]]
    let tRows = rowIds[0]
    searchResultList.forEach((result) => {
      tRows.push(result.searchKey)
      searchResultWithSection[':' + result.searchKey] = result
    })
    return {
      searchResultWithSection,
      rowIds
    }
  }

  static generateSearchHandler (source) {
    let searchHandler = null
    if (containsChinese(source)) {
      searchHandler = {}
      searchHandler.charIndexerArr = []
      searchHandler.translatedStr = ''

      let translatedLength = 0
      for (let i = 0; i < source.length; i++) {
        let tempChar = source[i]

        let pinyinStr = pinyin.getFullChars(tempChar)

        let charIndexer = {}
        charIndexer.index = i
        charIndexer.startIndexInTransedStr = translatedLength
        charIndexer.endIndexInTransedStr = translatedLength + pinyinStr.length - 1
        charIndexer.pinyinStr = pinyinStr.toLowerCase()

        searchHandler.charIndexerArr.push(charIndexer)

        translatedLength += pinyinStr.length
        searchHandler.translatedStr += pinyinStr.toLowerCase()
      }
    }
    return searchHandler
  }

  static parseList (srcList) {
    let rowsWithSection = {}
    const sectionIDs = []
    const rowIds = [[]]
    /* 形成如下的结构
     let dataBlob = {
     'sectionID1' : { ...section1 data },
     'sectionID1:rowID1' : { ...row1 data },
     'sectionID1:rowID2' : { ..row2 data },
     'sectionID2' : { ...section2 data },
     'sectionID2:rowID1' : { ...row1 data },
     'sectionID2:rowID2' : { ..row2 data },
     ...
     }
     let sectionIDs = [ 'sectionID1', 'sectionID2', ... ]
     let rowIDs = [ [ 'rowID1', 'rowID2' ], [ 'rowID1', 'rowID2' ], ... ]
     */
    srcList.forEach((item) => {
      if (item) {
        // 加入到section
        let orderIndex = item.orderIndex
        if (!isCharacter(item.orderIndex)) {
          orderIndex = '#'
        }
        if (!rowsWithSection[orderIndex]) {
          rowsWithSection[orderIndex] = orderIndex
          sectionIDs.push(orderIndex)
        }

        // rows组装
        // 1. 保证row数组长度和section数组长度一致
        let sectionIndex = sectionIDs.findIndex((tIndex) => {
          return orderIndex === tIndex
        })
        for (let i = rowIds.length; i <= sectionIndex; i++) {
          rowIds.push([])
        }
        // 2. 在section对应的数组加入row id
        let tRows = rowIds[sectionIndex]
        if (tRows) {
          tRows.push(item.searchKey)
        }

        // 3. 实际数据加入friendWithSection
        let itemKey = orderIndex + ':' + item.searchKey
        rowsWithSection[itemKey] = item
      }
    })

    return {
      rowsWithSection,
      sectionIDs,
      rowIds
    }
  }

  static initList (srcList) {
    srcList.forEach((item) => {
      if (item) {
        // 生成排序索引
        item.orderIndex = ''
        item.isCN = 0

        if (item.searchStr) {
          let tempStr = sTrim(item.searchStr)

          if (tempStr !== '') {
            // 补充首字母
            let firstChar = item.searchStr[0]

            if (containsChinese(firstChar)) {
              let pinyinChar = pinyin.getCamelChars(firstChar)

              if (pinyinChar) {
                item.orderIndex = pinyinChar.toUpperCase()
                item.isCN = 1
              }
            } else {
              item.orderIndex = firstChar.toUpperCase()
              item.isCN = 0
            }
          }
          // 对中文进行处理
          let handler = SearchService.generateSearchHandler(item.searchStr)
          if (handler) {
            item.searchHandler = handler
          }
          if (!item.searchKey) {
            item.searchKey = md5(item.searchStr)
          }
        }
      }
    })
    return srcList
  }

  static sortList (srcList, sortFunc) {
    srcList.sort(sortFunc || function (a, b) {
      if (!isCharacter(b.orderIndex)) {
        return -1
      } else if (!isCharacter(a.orderIndex)) {
        return 1
      } else if (b.orderIndex > a.orderIndex) {
        return -1
      } else if (b.orderIndex < a.orderIndex) {
        return 1
      } else {
        if (b.isCN > a.isCN) {
          return -1
        } else if (b.isCN < a.isCN) {
          return 1
        } else {
          return 0
        }
      }
    })

    return srcList
  }
}
