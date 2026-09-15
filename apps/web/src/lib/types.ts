// UI-only display types — not mirroring the API schema.
// Real API types live in @/lib/api-client.

/** Display plan shape used by PlanCard and the pricing page. */
export interface Plan {
  id: string;
  audience: "buyer" | "seller";
  name: string;
  price: number;
  interval: "mo";
  tagline: string;
  features: string[];
  highlighted?: boolean;
}
