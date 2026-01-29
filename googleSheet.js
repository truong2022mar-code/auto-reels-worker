import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SHEET_ID = process.env.SHEET_ID
const CLIENT_EMAIL = process.env.GS_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GS_PRIVATE_KEY

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheet environment variables')
}

function createDoc() {
  const auth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return new GoogleSpreadsheet(SHEET_ID, auth)
}

/**
 * Lấy danh sách job chưa chạy (Status trống)
 */
export async function readJobs() {
  const doc = createDoc()
  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]
  const rows = await sheet.getRows()

  return rows.filter(row => {
    const status = (row.Status || '').trim()
    return status === ''
  })
}

/**
 * Cập nhật trạng thái job
 * @param {GoogleSpreadsheetRow} row
 * @param {string} status
 * @param {string} message
 */
export async function updateJob(row, status, message = '') {
  row.Status = status
  row.Message = message
  row.UpdatedAt = new Date().toISOString()
  await row.save()
}
