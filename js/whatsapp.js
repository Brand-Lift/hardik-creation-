/* ================================================================
   whatsapp.js — WhatsApp Message URL Generator
   Generates a wa.me URL with order details.

   CRITICAL BUSINESS RULE:
   - The message MUST NOT contain "user will manually attach"
   - Message contains ONLY: Order ID, Items, Total, Address
   ================================================================ */

'use strict';

/**
 * Generates the WhatsApp redirect URL for order confirmation.
 *
 * @param {string} orderId       - Unique order identifier
 * @param {Object} orderData     - Order details object
 * @returns {string}             - wa.me URL with encoded message
 */
function generateWhatsAppURL(orderId, orderData) {
  const whatsappNumber = CONFIG.WHATSAPP_NUMBER; // e.g., '919876543210'

  // Format cart items list clearly
  const itemsList = (orderData.items || [])
    .map((item, idx) =>
      `  ${idx + 1}. ${item.name} × ${item.quantity} — ₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}`
    )
    .join('\n');

  // Full delivery address string
  const fullAddress = [
    orderData.customer_address,
    orderData.customer_city,
    orderData.customer_pincode,
  ].filter(Boolean).join(', ');

  // Payment info
  const paymentInfo = orderData.payment_method === 'UPI'
    ? `UPI Transfer (Screenshot to be attached separately)`
    : `Cash on Delivery (COD)`;

  // ─── WhatsApp Message (Strictly: Order ID, Items, Total, Address) ───
  const message = [
    `🛍️ *NEW ORDER — HARDIK CREATIONS*`,
    ``,
    `📦 *Order ID:* ${orderId}`,
    `📅 *Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    ``,
    `👤 *Customer Details*`,
    `   Name   : ${orderData.customer_name}`,
    `   Phone  : ${orderData.customer_phone}`,
    ``,
    `📍 *Delivery Address*`,
    `   ${fullAddress}`,
    ``,
    `🧾 *Items Ordered*`,
    itemsList,
    ``,
    `💰 *Total Amount: ₹${Number(orderData.total_amount).toLocaleString('en-IN')}*`,
    `💳 *Payment Method:* ${paymentInfo}`,
    ``,
    `📌 *Delivery Charge:* FREE`,
    ``,
    `─────────────────────────`,
    `Thank you for shopping with Hardik Creations! 🙏`,
  ].join('\n');

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS
   ───────────────────────────────────────────────────── */
window.generateWhatsAppURL = generateWhatsAppURL;
