const pool = require('../config/db');
const { createOrderRecord } = require('./orderController');

function formatRs(value) {
  return `Rs. ${Number(value).toLocaleString('en-LK', { maximumFractionDigits: 0 })}/=`;
}

function buildCustomerMessage(lineItems, total, senderName, senderPhone) {
  const lines = lineItems.map((item, index) => {
    const label = item.product_code ? `#${item.product_code}` : item.product_name;
    return `${index + 1}. ${label} x${item.quantity} - ${formatRs(item.price * item.quantity)}`;
  });
  return [
    `New order request from ${senderName}${senderPhone ? ' (' + senderPhone + ')' : ''}:`,
    '',
    ...lines,
    '',
    `Total: ${formatRs(total)}`,
  ].join('\n');
}

function buildSellerMessage(lineItems, total, senderName, senderPhone) {
  const lines = lineItems.map((item, index) => {
    const label = item.product_code ? `#${item.product_code}` : item.product_name;
    return `${index + 1}. ${label} x${item.quantity} @ ${formatRs(item.price)} (purchase price) - ${formatRs(item.price * item.quantity)}`;
  });
  return [
    `New SELLER restock request from ${senderName}${senderPhone ? ' (' + senderPhone + ')' : ''}:`,
    '',
    ...lines,
    '',
    `Total (at purchase price): ${formatRs(total)}`,
  ].join('\n');
}

async function sendWhatsAppText(to, message) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const waRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });
    const data = await waRes.json();
    if (!waRes.ok) {
      console.error('[whatsapp] send failed:', data);
      return { ok: false, reason: data.error?.message || 'send_failed' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[whatsapp] send error:', err);
    return { ok: false, reason: 'network_error' };
  }
}

async function sendOrderRequest(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const isSeller = req.user.type === 'staff' && req.user.role === 'Seller';
  const connection = await pool.getConnection();
  let orderResult;
  try {
    await connection.beginTransaction();
    const requester = { type: req.user.type, id: req.user.id, name: req.user.name, phone: req.user.phone };
    orderResult = await createOrderRecord(connection, requester, items, {
      priceMode: isSeller ? 'cost' : 'retail',
    });
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(400).json({ message: err.message || 'Failed to place order' });
  } finally {
    connection.release();
  }

  let senderPhone = req.user.phone || null;
  if (!senderPhone) {
    if (req.user.type === 'customer') {
      const [rows] = await pool.query('SELECT whatsapp_number FROM customers WHERE id = ?', [req.user.id]);
      if (rows.length > 0) senderPhone = rows[0].whatsapp_number;
    } else if (req.user.id !== 0) {
      const [rows] = await pool.query('SELECT phone FROM users WHERE id = ?', [req.user.id]);
      if (rows.length > 0) senderPhone = rows[0].phone;
    }
  }

  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  const message = isSeller
    ? buildSellerMessage(orderResult.lineItems, orderResult.total, req.user.name, senderPhone)
    : buildCustomerMessage(orderResult.lineItems, orderResult.total, req.user.name, senderPhone);

  const waResult = adminNumber
    ? await sendWhatsAppText(adminNumber, message)
    : { ok: false, reason: 'not_configured' };

  if (waResult.ok) {
    return res.status(201).json({ id: orderResult.orderId, message: 'Order sent successfully' });
  }

  res.status(201).json({
    id: orderResult.orderId,
    message: 'Order placed! WhatsApp notification could not be sent, but your order is saved and visible in Orders.',
  });
}

module.exports = { sendOrderRequest, sendWhatsAppText };
