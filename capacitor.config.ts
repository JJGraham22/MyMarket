import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mymarket.app",
  appName: "MyMarket",
  webDir: "out",
  server: {
    // In development, point to the Next.js dev server
    // Comment this out for production builds
    // url: "http://localhost:3000",

    // In production, the native app loads from the deployed web server
    // so that API routes and server components work correctly.
    // Set this to your deployed URL when building for production.
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { url: process.env.NEXT_PUBLIC_SITE_URL }
      : {}),

    // Allow mixed content for development
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1510",
      showSpinner: false,
    },
  },
};

export default config;
