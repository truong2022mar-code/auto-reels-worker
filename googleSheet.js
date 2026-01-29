import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SHEET_ID = process.env.SHEET_ID

const serviceAccount = {
  client_email: process.env.GS_CLIENT_EMAIL,
  private_key: process.env.GS_PRIVATE_KEY.replace(/\\n/g, '\n'),
}

export async function readJobs() {
  const auth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const doc = new GoogleSpreadsheet(SHEET_ID, auth)
  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]
  const rows = await sheet.getRows()

  return rows.filter(r => !r.Status)
}

export async function updateJob(row, status, message = '') {
  row.Status = status
  row.Message = message
  row.UpdatedAt = new Date().toISOString()
  await row.save()
}
