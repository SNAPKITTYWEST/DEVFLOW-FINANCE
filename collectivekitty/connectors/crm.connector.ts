export async function syncDeal(dealId: string) {
  // CRM → Bifrost pipeline
  return { connected: true, source: "crm" }
}
