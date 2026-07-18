import type { Intent, LeverageItem } from "./schema";

export const LEVERAGE_RULES: Record<Intent, LeverageItem[]> = {
  refund_request: [
    {
      claim:
        "Ask the seller to repair, replace, or refund defective goods under the warranty, return policy, or consumer rules that apply to the purchase.",
      basis:
        "Receipt, warranty, seller return policy, and applicable consumer protection rules",
      confidence: 0.82,
      source: "curated",
    },
    {
      claim:
        "If a card purchase is still unresolved, ask the card issuer to register a dispute before the applicable card-network window closes.",
      basis:
        "Card issuer terms and the applicable Visa, Mastercard, RuPay, or other network dispute rules",
      confidence: 0.78,
      source: "curated",
    },
    {
      claim:
        "For an Indian consumer purchase, a proven defect can support repair, replacement, or return of the price through consumer redressal.",
      basis: "Consumer Protection Act, 2019, section 39",
      confidence: 0.84,
      source: "curated",
    },
  ],
  subscription_cancel: [
    {
      claim:
        "Use any trial or cooling-off cancellation period stated at signup, and ask the provider to confirm the effective cancellation date before it expires.",
      basis:
        "Signup confirmation, subscription terms, and applicable distance-selling rules",
      confidence: 0.77,
      source: "curated",
    },
    {
      claim:
        "If no cooling-off right applies, rely on the disclosed cancellation and renewal terms and ask that future renewals stop by a stated date.",
      basis: "Subscription agreement and provider cancellation policy",
      confidence: 0.8,
      source: "curated",
    },
    {
      claim:
        "For an online subscription sold in India, ask the provider to identify the disclosed term supporting any cancellation charge or refusal.",
      basis:
        "Consumer Protection Act, 2019 and Consumer Protection (E-Commerce) Rules, 2020",
      confidence: 0.72,
      source: "curated",
    },
  ],
  deposit_return: [
    {
      claim:
        "Request the undisputed deposit by a specific date and ask for an itemised list with evidence for any deductions.",
      basis:
        "Signed lease or tenancy agreement, condition report, and payment receipt",
      confidence: 0.83,
      source: "curated",
    },
    {
      claim:
        "Quote the deposit-return deadline in the agreement. If none is stated, ask for the legal or contractual basis for holding the deposit.",
      basis: "Lease terms and applicable local tenancy rules",
      confidence: 0.75,
      source: "curated",
    },
  ],
  invoice_chase: [
    {
      claim:
        "Restate the invoice number, amount, agreed due date, and a clear payment or response deadline.",
      basis: "Invoice, purchase order, contract, and delivery record",
      confidence: 0.85,
      source: "curated",
    },
    {
      claim:
        "If the supplier qualifies as a micro or small enterprise in India, flag the statutory late-payment rules and ask the buyer to verify they apply.",
      basis:
        "Micro, Small and Medium Enterprises Development Act, 2006, sections 15 and 16",
      confidence: 0.78,
      source: "curated",
    },
  ],
  reschedule: [
    {
      claim:
        "Quote the confirmed booking and rescheduling terms, then offer practical alternative dates with a clear response deadline.",
      basis: "Booking confirmation and provider rescheduling policy",
      confidence: 0.82,
      source: "curated",
    },
    {
      claim:
        "If the provider caused the change, ask it to waive fees or offer a refund where its published terms provide for that outcome.",
      basis: "Provider cancellation policy and booking terms",
      confidence: 0.78,
      source: "curated",
    },
  ],
  complaint: [],
  other: [],
};

export function lookupLeverage(
  intent: Intent,
): { items: LeverageItem[]; needsModelFallback: boolean } {
  const items = LEVERAGE_RULES[intent];

  return {
    items,
    needsModelFallback: items.length === 0,
  };
}
