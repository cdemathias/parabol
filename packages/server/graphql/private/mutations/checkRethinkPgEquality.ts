import fs from 'fs'
import path from 'path'
import getRethink from '../../../database/rethinkDriver'
import getKysely from '../../../postgres/getKysely'
import {checkRowCount, checkTableEq} from '../../../postgres/utils/checkEqBase'
import {
  compareDateAlmostEqual,
  compareRValUndefinedAsNullAndTruncateRVal,
  defaultEqFn
} from '../../../postgres/utils/rethinkEqualityFns'
import {MutationResolvers} from '../resolverTypes'

const handleResult = async (
  tableName: string,
  rowCountResult: string,
  errors: any[],
  writeToFile: boolean | undefined | null
) => {
  const result = [rowCountResult, ...errors]
  const resultStr = JSON.stringify(result)
  if (!writeToFile) return resultStr

  const fileName = `${tableName}-${new Date()}`
  const fileDir = path.join(process.cwd(), '__rethinkEquality__')
  const fileLocation = path.join(fileDir, fileName)
  await fs.promises.mkdir(fileDir, {recursive: true})
  await fs.promises.writeFile(fileLocation, resultStr)
  return `Result written to ${fileLocation}`
}

const checkRethinkPgEquality: MutationResolvers['checkRethinkPgEquality'] = async (
  _source,
  {tableName, writeToFile}
) => {
  const r = await getRethink()

  if (tableName === 'RetroReflectionGroup') {
    const rowCountResult = await checkRowCount(tableName)
    const rethinkQuery = (updatedAt: Date, id: string | number) => {
      return r
        .table('RetroReflectionGroup')
        .between([updatedAt, id], [r.maxval, r.maxval], {
          index: 'updatedAtId',
          leftBound: 'open',
          rightBound: 'closed'
        })
        .orderBy({index: 'updatedAtId'}) as any
    }
    const pgQuery = (ids: string[]) => {
      return getKysely()
        .selectFrom('RetroReflectionGroup')
        .selectAll()
        .where('id', 'in', ids)
        .execute()
    }
    const errors = await checkTableEq(rethinkQuery, pgQuery, {
      id: defaultEqFn,
      createdAt: defaultEqFn,
      updatedAt: compareDateAlmostEqual,
      isActive: defaultEqFn,
      meetingId: defaultEqFn,
      promptId: defaultEqFn,
      sortOrder: defaultEqFn,
      voterIds: defaultEqFn,
      smartTitle: compareRValUndefinedAsNullAndTruncateRVal(255),
      title: compareRValUndefinedAsNullAndTruncateRVal(255),
      summary: compareRValUndefinedAsNullAndTruncateRVal(2000),
      discussionPromptQuestion: compareRValUndefinedAsNullAndTruncateRVal(2000)
    })
    return handleResult(tableName, rowCountResult, errors, writeToFile)
  }
  return 'Table not found'
}

export default checkRethinkPgEquality
