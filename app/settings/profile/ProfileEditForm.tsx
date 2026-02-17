"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { PageHeader, Card, Button, Input, Toast } from "@/app/components/ui";

const SELLER_TAG_OPTIONS = [
  "Vegetables",
  "Eggs",
  "Honey",
  "Dairy",
  "Meat",
  "Bread",
  "Flowers",
  "Preserves",
  "Fruit",
  "Other",
];

interface ProfileEditFormProps {
  userId: string;
  initial: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    role: string;
    tags: string[];
  };
}

export function ProfileEditForm({ userId, initial }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const isSeller = initial.role === "seller";

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        ...(isSeller ? { tags } : {}),
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setToastVisible(true);
    }
    setSaving(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <PageHeader
          title="Edit profile"
          subtitle="Update your display name, bio, and avatar. Sellers can add product tags."
        />

        <Card padding="lg" className="space-y-6 p-6 sm:p-8">
          <Input
            id="display_name"
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name or stall name"
          />
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-[var(--cream-muted)]"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="input w-full resize-y"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about you or your stall…"
            />
          </div>
          <Input
            id="avatar_url"
            label="Avatar image URL"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
          {avatarUrl && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--cream-muted)]">Preview:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-16 w-16 rounded-full object-cover border-2 border-[var(--brown-soft)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {isSeller && (
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--cream-muted)]">
                Product tags (seller)
              </label>
              <p className="mb-3 text-xs text-[var(--cream-muted)]">
                Select the categories that describe what you sell.
              </p>
              <div className="flex flex-wrap gap-2">
                {SELLER_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                    style={
                      tags.includes(tag)
                        ? {
                            background: "var(--green-bg)",
                            color: "var(--green-pale)",
                            border: "1px solid var(--green-soft)",
                          }
                        : {
                            background: "var(--brown-bg)",
                            color: "var(--cream-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </Card>
      </form>

      <Toast
        message="Profile saved!"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}
