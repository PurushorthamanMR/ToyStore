const { google } = require('googleapis');
const { Readable } = require('stream');
const pool = require('./src/config/db');

async function buildDriveClient(config) {
  const auth = new google.auth.JWT({
    email: config.drive_client_email,
    key: String(config.drive_private_key || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

pool.query('SELECT drive_client_email, drive_private_key, drive_folder_id FROM settings WHERE id=1').then(async ([[row]]) => {
  const drive = await buildDriveClient(row);
  try {
    const res = await drive.files.create({
      requestBody: { name: 'test.txt', parents: [row.drive_folder_id] },
      media: { mimeType: 'text/plain', body: Readable.from(Buffer.from('hello')) },
      fields: 'id',
    });
    console.log('SUCCESS', res.data);
  } catch (err) {
    console.log('err.message:', err.message);
    console.log('err.errors:', JSON.stringify(err.errors));
    console.log('err.code:', err.code);
    console.log('err.response.data:', JSON.stringify(err.response?.data));
  }
  process.exit(0);
});
