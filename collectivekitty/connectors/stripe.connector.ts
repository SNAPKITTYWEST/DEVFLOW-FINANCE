export async function syncPayment(paymentId: string) {
  // Stripe → Bifrost pipeline
  return { connected: false, reason: "API key required" }
}
