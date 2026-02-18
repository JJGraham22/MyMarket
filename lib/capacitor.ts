/**
 * Capacitor platform detection utilities.
 *
 * These helpers let components adapt their behavior based on whether the app
 * is running inside a native Capacitor shell (iOS/Android) or in a web browser.
 *
 * IMPORTANT: This file is safe to import from "use client" components.
 */

/**
 * Returns true if the app is running inside a native Capacitor shell.
 * Returns false when running in a regular web browser.
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // Capacitor injects this on native platforms
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

/**
 * Returns the current platform: "ios", "android", or "web".
 */
export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";

  try {
    const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor;
    const platform = cap?.getPlatform?.();
    if (platform === "ios") return "ios";
    if (platform === "android") return "android";
    return "web";
  } catch {
    return "web";
  }
}
