const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function checkSheets() {
  try {
    const credsPath = './google-credentials.json';
    if (!fs.existsSync(credsPath)) {
      console.log('No credentials found.');
      return;
    }
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const auth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SPREADSHEET_ID = '1Rs3oBtF-WDw0vMlYZS8wwWuL79jRJZBHjpqfmwrQI-k';
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    
    await doc.loadInfo();
    console.log('Document loaded. Tabs:');
    
    let matchFound = false;
    for (const sheet of doc.sheetsByIndex) {
      if (sheet.title === 'Expense' || sheet.title === 'travel-expenses' || sheet.title === 'travel_expenses') {
         matchFound = true;
         console.log('---');
         console.log('Tab Name:', sheet.title);
         try {
           await sheet.loadHeaderRow();
           console.log('Headers:', sheet.headerValues);
         } catch (err) {
           console.log('Headers error:', err.message);
         }
      }
    }
    
    if (!matchFound) {
      console.log('None of the expected sheet names were found. Here are the ones available:');
      doc.sheetsByIndex.forEach(s => console.log(s.title));
    }
  } catch (err) {
    console.error('Error fetching sheets:', err);
  }
}
checkSheets();
