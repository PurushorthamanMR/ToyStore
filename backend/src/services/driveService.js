const { google } = require('googleapis');
const { Readable } = require('stream');

function buildDriveClient(config) {
  const auth = new google.auth.JWT({
    email: config.drive_client_email,
    key: String(config.drive_private_key || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

/** Uploads a file into the configured Drive folder and returns a publicly viewable URL. */
async function uploadFile(config, buffer, filename, mimetype) {
  const drive = buildDriveClient(config);

  try {
    const { data: file } = await drive.files.create({
      requestBody: { name: filename, parents: [config.drive_folder_id] },
      media: { mimeType: mimetype, body: Readable.from(buffer) },
      fields: 'id',
    });

    await drive.permissions.create({
      fileId: file.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return `https://drive.google.com/uc?export=view&id=${file.id}`;
  } catch (err) {
    const detail = err?.errors?.[0]?.message || err?.message || String(err);
    let friendly;
    if (/File not found|insufficient permission/i.test(detail)) {
      friendly = 'Google Drive upload failed: the folder was not found or is not shared with the Service Account email. Check the Folder ID and sharing settings.';
    } else if (/invalid_grant|error:0909006C|DECODER routines/i.test(detail)) {
      friendly = 'Google Drive upload failed: the Private Key looks invalid. Paste the full private key from the JSON key file, including the BEGIN/END lines.';
    } else {
      friendly = `Google Drive upload failed: ${detail}`;
    }
    const error = new Error(friendly);
    error.status = 502;
    throw error;
  }
}

module.exports = { uploadFile };
