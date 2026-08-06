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

/** Accept a raw ID or a full Drive folder URL. */
function normalizeFolderId(raw) {
  const value = String(raw || '').trim();
  const fromUrl = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return fromUrl ? fromUrl[1] : value;
}

/** Uploads a file into the configured Drive folder and returns a publicly viewable URL. */
async function uploadFile(config, buffer, filename, mimetype) {
  const drive = buildDriveClient(config);
  const folderId = normalizeFolderId(config.drive_folder_id);

  try {
    const { data: file } = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType: mimetype, body: Readable.from(buffer) },
      fields: 'id',
      supportsAllDrives: true,
    });

    await drive.permissions.create({
      fileId: file.id,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });

    return `https://drive.google.com/uc?export=view&id=${file.id}`;
  } catch (err) {
    const detail = err?.errors?.[0]?.message || err?.message || String(err);
    let friendly;
    if (/storage quota|do not have storage quota/i.test(detail)) {
      friendly =
        'Google Drive upload failed: Service Accounts cannot upload into a personal My Drive folder. Create a Shared Drive (Google Workspace), add the Service Account as Content Manager, put a folder inside it, and use that folder\'s ID.';
    } else if (/File not found|insufficient permission/i.test(detail)) {
      friendly =
        'Google Drive upload failed: the folder was not found or is not shared with the Service Account email. Use a Shared Drive folder and grant the Service Account Content Manager access.';
    } else if (/invalid_grant|error:0909006C|DECODER routines/i.test(detail)) {
      friendly =
        'Google Drive upload failed: the Private Key looks invalid. Paste the full private key from the JSON key file, including the BEGIN/END lines.';
    } else {
      friendly = `Google Drive upload failed: ${detail}`;
    }
    const error = new Error(friendly);
    error.status = 502;
    throw error;
  }
}

module.exports = { uploadFile };
