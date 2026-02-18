import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentSettingsClient } from "./PaymentSettingsClient";

export default async function PaymentSettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "payment_provider, square_merchant_id, stripe_connected_account_id, square_device_id"
    )
    .eq("id", user.id)
    .single();

  return (
    <PaymentSettingsClient
      userId={user.id}
      initial={{
        payment_provider: profile?.payment_provider ?? "platform",
        square_merchant_id: profile?.square_merchant_id ?? null,
        stripe_connected_account_id:
          profile?.stripe_connected_account_id ?? null,
        square_device_id: profile?.square_device_id ?? null,
      }}
      searchParams={searchParams}
    />
  );
}
