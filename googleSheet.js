import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SHEET_ID = process.env.SHEET_ID
const CLIENT_EMAIL = process.env.GS_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GS_PRIVATE_KEY

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheet env vars')
}

function getDoc() {
  const auth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return new GoogleSpreadsheet(SHEET_ID, auth)
}

export async function readJobs() {
  const doc = getDoc()
  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]
  const rows = await sheet.getRows()

  return rows.filter(r => !r.Status || r.Status.trim() === '')
}

export async function updateJob(row, status, message = '') {
  row.Status = status
  row.Message = message
  row.UpdatedAt = new Date().toISOString()
  await row.save()
}
