const { GoogleSpreadsheet } = require("google-spreadsheet");
const config = require("./config.json");

async function readJobs() {
  const doc = new GoogleSpreadsheet(config.SPREADSHEET_ID);
  await doc.useServiceAccountAuth(require("./service_account.json"));
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
  const doc = new GoogleSpreadsheet(config.SPREADSHEET_ID);
  await doc.useServiceAccountAuth(require("./service_account.json"));
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Log Progress"];
  const row = await sheet.getRows({ offset: rowNumber - 2, limit: 1 });

  Object.keys(data).forEach(k => {
    row[0][k] = data[k];
  });

  await row[0].save();
}

module.exports = { readJobs, updateRow };
