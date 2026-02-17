import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SellerUpgradePage } from "./SellerUpgradePage";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=" + encodeURIComponent("/seller/checkout"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "buyer";

  if (role !== "seller") {
    return <SellerUpgradePage />;
  }

  return <>{children}</>;
}
