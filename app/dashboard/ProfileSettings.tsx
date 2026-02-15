"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface ProfileData {
  display_name: string;
  tagline: string;
  bio: string;
  theme_color: string;
  logo_url: string;
  banner_url: string;
}

const BUCKET = "profile-assets";

export function ProfileSettings({ userId }: { userId: string }) {
  const [form, setForm] = useState<ProfileData>({
    display_name: "",
    tagline: "",
    bio: "",
    theme_color: "#16a34a",
    logo_url: "",
    banner_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load current profile
  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("profiles")
        .select("display_name, tagline, bio, theme_color, logo_url, banner_url")
        .eq("id", userId)
        .single();

      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          tagline: data.tagline ?? "",
          bio: data.bio ?? "",
          theme_color: data.theme_color ?? "#16a34a",
          logo_url: data.logo_url ?? "",
          banner_url: data.banner_url ?? "",
        });
        if (data.logo_url) setLogoPreview(data.logo_url);
        if (data.banner_url) setBannerPreview(data.banner_url);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  // Upload helper
  const uploadFile = useCallback(
    async (file: File, slot: "logo" | "banner"): Promise<string | null> => {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/${slot}.${ext}`;

      // Upsert: remove old file first (ignore errors if it doesn't exist)
      await supabase.storage.from(BUCKET).remove([path]);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) {
        setMessage({ type: "err", text: `Upload failed: ${error.message}` });
        return null;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      // Bust browser cache with timestamp
      return urlData.publicUrl + "?t=" + Date.now();
    },
    [userId]
  );

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMessage(null);

    // Local preview immediately
    setLogoPreview(URL.createObjectURL(file));

    const url = await uploadFile(file, "logo");
    if (url) {
      setForm((prev) => ({ ...prev, logo_url: url }));
      setLogoPreview(url);
    }
    setUploadingLogo(false);
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setMessage(null);

    setBannerPreview(URL.createObjectURL(file));

    const url = await uploadFile(file, "banner");
    if (url) {
      setForm((prev) => ({ ...prev, banner_url: url }));
      setBannerPreview(url);
    }
    setUploadingBanner(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name || null,
        tagline: form.tagline || null,
        bio: form.bio || null,
        theme_color: form.theme_color || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
      })
      .eq("id", userId);

    if (error) {
      setMessage({ type: "err", text: error.message });
    } else {
      setMessage({ type: "ok", text: "Profile saved!" });
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading profile settings…</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ── Banner upload ──────────────────────────────── */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Banner Image
        </label>
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="relative w-full overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-900/40 transition-colors hover:border-emerald-500/40"
          style={{ height: "140px" }}
        >
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerPreview}
              alt="Banner preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-slate-500">
              Click to upload banner (recommended 1200 x 300)
            </span>
          )}
          {uploadingBanner && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
              <span className="text-xs text-slate-300">Uploading…</span>
            </div>
          )}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleBannerChange}
          className="hidden"
        />
      </div>

      {/* ── Logo upload ────────────────────────────────── */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Shop Logo
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-700 bg-slate-900/40 transition-colors hover:border-emerald-500/40"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[0.6rem] text-slate-500">Upload</span>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/60">
                <span className="text-[0.6rem] text-slate-300">…</span>
              </div>
            )}
          </button>
          <p className="text-xs text-slate-500">
            Square image, max 2 MB. PNG, JPEG, WebP, or GIF.
          </p>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      {/* ── Text fields ────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Display name */}
        <div>
          <label
            htmlFor="display_name"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Display Name
          </label>
          <input
            id="display_name"
            type="text"
            value={form.display_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, display_name: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
            placeholder="Your farm name"
          />
        </div>

        {/* Theme color */}
        <div>
          <label
            htmlFor="theme_color"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="theme_color"
              type="color"
              value={form.theme_color}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, theme_color: e.target.value }))
              }
              className="h-9 w-9 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
            />
            <input
              type="text"
              value={form.theme_color}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, theme_color: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              placeholder="#16a34a"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label
          htmlFor="tagline"
          className="mb-1 block text-xs font-medium text-slate-400"
        >
          Tagline
        </label>
        <input
          id="tagline"
          type="text"
          value={form.tagline}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, tagline: e.target.value }))
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
          placeholder="Fresh organic veggies from the Blue Mountains"
          maxLength={120}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="mb-1 block text-xs font-medium text-slate-400"
        >
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          value={form.bio}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, bio: e.target.value }))
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
          placeholder="Tell customers about your farm, produce, and story…"
        />
      </div>

      {/* Messages */}
      {message && (
        <p
          className={`rounded-md border px-3 py-2 text-xs ${
            message.type === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
