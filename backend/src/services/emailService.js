const nodemailer = require('nodemailer');
const pool = require('../config/db');

const PURPOSE_SUBJECTS = {
  register_customer: 'Verify your email to finish signing up',
  register_seller: 'Verify your email to finish your seller application',
  forgot_password: 'Your password reset code',
  change_email: 'Verify your new email address',
};

async function getSmtpConfig() {
  const [[row]] = await pool.query(
    'SELECT smtp_host, smtp_port, smtp_user, smtp_pass, email_from FROM settings WHERE id = 1'
  );
  return row;
}

async function sendOtpEmail(to, code, purpose) {
  const subject = PURPOSE_SUBJECTS[purpose] || 'Your verification code';
  const config = await getSmtpConfig();

  if (!config?.smtp_host) {
    // No SMTP configured in Admin Settings yet - print the code instead of sending.
    console.log(`[otp] code for ${to} (${purpose}): ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: String(config.smtp_host || '').trim(),
    port: Number(config.smtp_port) || 587,
    secure: Number(config.smtp_port) === 465,
    requireTLS: Number(config.smtp_port) !== 465,
    auth: {
      user: String(config.smtp_user || '').trim(),
      pass: String(config.smtp_pass || '').trim(),
    },
  });

  try {
    await transporter.sendMail({
      from: String(config.email_from || config.smtp_user || '').trim(),
      to,
      subject,
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error('[smtp] send failed:', err.message);
    console.error('[smtp] using user:', String(config.smtp_user || '').trim(), 'host:', config.smtp_host, 'port:', config.smtp_port);
    const msg = err.message || '';
    const response = err.response || '';
    const combined = `${msg} ${response}`;
    let friendly;
    if (/525|unauthorized ip/i.test(combined)) {
      friendly =
        'Brevo blocked this computer\'s IP. In Brevo go to Settings → SMTP & API → Authorized IPs, and either add your current public IP or turn off IP restriction for SMTP keys. Then try again.';
    } else if (/auth|535|credentials|invalid login/i.test(combined)) {
      const user = String(config.smtp_user || '').trim();
      friendly = !/@smtp-brevo\.com$/i.test(user)
        ? `Email login failed. Your SMTP Username is currently "${user}". For Brevo it must look like xxx@smtp-brevo.com (from Brevo → Settings → SMTP & API → Login). Password must be an SMTP key.`
        : 'Email login failed. Username looks correct — regenerate a new SMTP key in Brevo and paste it into SMTP Password (no spaces).';
    } else {
      friendly = `Failed to send email: ${msg}`;
    }
    const error = new Error(friendly);
    error.status = 502;
    throw error;
  }
}

module.exports = { sendOtpEmail };
