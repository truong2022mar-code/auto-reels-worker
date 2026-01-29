const { GoogleSpreadsheet } = require("google-spreadsheet");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const doc = new GoogleSpreadsheet(config.SPREADSHEET_ID);

await doc.useServiceAccountAuth({
  client_email: serviceAccount.client_email,
  private_key: serviceAccount.private_key,
});
