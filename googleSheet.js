const { GoogleSpreadsheet } = require('google-spreadsheet');

const serviceAccount = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT
);

async function readJobs() {
  const doc = new GoogleSpreadsheet(
    process.env.SPREADSHEET_ID
  );

  await doc.useServiceAccountAuth(serviceAccount);
  await doc.loadInfo();

  return doc.sheetsByIndex[0].getRows();
}

module.exports = { readJobs };
