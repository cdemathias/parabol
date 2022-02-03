import {ReactjiType} from '../graphql/types/Reactji'
import Reactji from '../database/types/Reactji'

const getGroupedReactjis = (reactjis: Reactji[], viewerId: string, idPrefix: string) => {
  const agg = {} as {[key: string]: ReactjiType}
  reactjis.forEach((reactji) => {
    const {id, userId} = reactji
    const guid = `${idPrefix}:${id}`
    const isViewerReactji = viewerId === userId
    const record = agg[guid]
    if (!record) {
      agg[guid] = {id: guid, count: 1, isViewerReactji}
    } else {
      record.count++
      record.isViewerReactji = record.isViewerReactji || isViewerReactji
    }
  })

  return Object.values(agg)
}

export default getGroupedReactjis
