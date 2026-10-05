import { api } from "../api/client";

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.onload = resolve;
    s.onerror = () =>
      reject(new Error("Could not load Razorpay. Check your connection."));
    document.body.appendChild(s);
  });

// Resolves "paid" or "dismissed"; rejects on API/verification errors
export async function payWithRazorpay(orderId, user) {
  await loadScript();

  const rp = await api("/payments/razorpay/create", {
    method: "POST",
    body: { orderId },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: rp.key,
      amount: rp.amount,
      currency: rp.currency,
      order_id: rp.razorpayOrderId,
      name: "Shop",
      description: "Order payment",
      prefill: { name: user?.name, email: user?.email },
      theme: { color: "#4f46e5" },
      handler: async (response) => {
        try {
          await api("/payments/razorpay/verify", {
            method: "POST",
            body: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
          resolve("paid");
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => resolve("dismissed") },
    });
    checkout.open();
  });
}
