import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./ProfileEditForm";

export const metadata = {
  title: "Edit profile — My Market",
};

export default async function SettingsProfilePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=" + encodeURIComponent("/settings/profile"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, role, tags")
    .eq("id", user.id)
    .single();

  const tags = profile?.tags ?? [];
  const tagsArray = Array.isArray(tags) ? tags : [];

  return (
    <ProfileEditForm
      userId={user.id}
      initial={{
        display_name: profile?.display_name ?? null,
        bio: profile?.bio ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? "buyer",
        tags: tagsArray,
      }}
    />
  );
}
