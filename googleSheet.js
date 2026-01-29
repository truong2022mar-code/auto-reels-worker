const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const config = require("./config.json");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

function getDoc() {
  const auth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return new GoogleSpreadsheet(config.SPREADSHEET_ID, auth);
}

async function readJobs() {
  const doc = getDoc();
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Log Progress"];

  const lastRow = sheet.rowCount;
  const start = Math.max(2, lastRow - config.READ_LIMIT);

  const rows = await sheet.getRows({ offset: start - 2 });

  return rows.map(r => ({
    row: r._rowNumber,
    pageSet: r["PageSet"],
    scheduleTime: r["ScheduleTime"],
    status: r["Status"],
    linkReels: r["Link Reels"],
    delayComment: r["Delay Comment"],
    comment: r["Comment"]
  }));
}

async function updateRow(rowNumber, data) {
  const doc = getDoc();
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Log Progress"];
  const rows = await sheet.getRows({ offset: rowNumber - 2, limit: 1 });

  Object.keys(data).forEach(k => {
    rows[0][k] = data[k];
  });

  await rows[0].save();
}

module.exports = { readJobs, updateRow };
