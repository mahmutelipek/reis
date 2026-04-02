import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/v/"],
        disallow: ["/library", "/api/", "/sign-in", "/sign-up"],
      },
    ],
  };
}
