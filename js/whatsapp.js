/* ================================================================
   whatsapp.js — WhatsApp URL Generator
   Generates a pre-filled WhatsApp message for the order
   (Screenshot must be attached manually by the user)
   ================================================================ */

'use strict';

/**
 * Generates a WhatsApp URL with order details.
 * The user will manually attach the payment screenshot in WhatsApp.
 */
function generateWhatsAppURL(orderId, orderData) {
  // Format items list
  const itemsList = (orderData.items || []).map(item =>
    `• ${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
  ).join('\n');

  // Build message
  const message = `🛒 *New Order - ${orderId}*\n\n` +
    `*Customer:* ${orderData.customer_name}\n` +
    `*Phone:* ${orderData.customer_phone}\n` +
    `*Address:* ${orderData.customer_address}, ${orderData.customer_city} - ${orderData.customer_pincode}\n` +
    `*Payment Method:* ${orderData.payment_method === 'UPI' ? '📱 UPI Transfer' : '💵 Cash on Delivery'}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Total Amount:* ₹${Number(orderData.total_amount).toLocaleString('en-IN')}\n\n` +
    `Please confirm the order and update the status.\n` +
    (orderData.payment_method === 'UPI' ? `📸 *Payment Screenshot Attached Below:*` : '');

  // Encode message for WhatsApp URL
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
}

window.generateWhatsAppURL = generateWhatsAppURL;
