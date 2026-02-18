import { getSquareClient, getSquareClientForSeller } from "@/lib/square";
import type { Currency } from "square";
import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
} from "./types";
import { randomUUID } from "crypto";

/**
 * Square payment provider.
 *
 * Uses the platform's Square account by default. If seller credentials are
 * provided, payments go through the seller's linked Square account.
 */
export class SquareProvider implements PaymentProvider {
  readonly providerType = "square" as const;
  private sellerAccessToken: string | null;
  private locationId: string | null;

  constructor(
    sellerAccessToken: string | null = null,
    locationId: string | null = null,
  ) {
    this.sellerAccessToken = sellerAccessToken;
    this.locationId = locationId;
  }

  private getClient() {
    if (this.sellerAccessToken) {
      return getSquareClientForSeller(this.sellerAccessToken);
    }
    return getSquareClient();
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    const client = this.getClient();

    const currency = params.currency.toUpperCase() as Currency;

    const lineItems = params.lineItems.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      basePriceMoney: {
        amount: BigInt(item.unitPriceCents),
        currency,
      },
    }));

    const idempotencyKey = randomUUID();
    const resolvedLocationId = this.locationId ?? await this.getDefaultLocationId();

    const response = await client.checkout.paymentLinks.create({
      idempotencyKey,
      order: {
        locationId: resolvedLocationId,
        lineItems,
        metadata: {
          orderId: params.orderId,
        },
      },
      checkoutOptions: {
        redirectUrl: params.successUrl,
      },
    });

    const paymentLink = response.paymentLink;

    if (!paymentLink?.url || !paymentLink?.id) {
      throw new Error("Square did not return a checkout URL.");
    }

    return {
      redirectUrl: paymentLink.url,
      sessionId: paymentLink.id,
    };
  }

  private async getDefaultLocationId(): Promise<string> {
    const client = this.getClient();
    const response = await client.locations.list();
    const locations = response.locations ?? [];

    if (locations.length === 0) {
      throw new Error(
        "No Square locations found. Please configure a location in your Square account."
      );
    }

    const active = locations.find((loc) => loc.status === "ACTIVE");
    if (!active?.id) {
      throw new Error("No active Square location found.");
    }

    return active.id;
  }
}
