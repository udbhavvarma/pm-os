import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://auxiliaire-os.vercel.app";
  return [{ url: origin, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
