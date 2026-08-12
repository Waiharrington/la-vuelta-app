import type { NextConfig } from "next";

const isExport = process.env.EXPORT_STATIC === "true";

const nextConfig: NextConfig = {
  output: isExport ? "export" : undefined,
  ...(isExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/sw.js",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=0, must-revalidate",
                },
                {
                  key: "Service-Worker-Allowed",
                  value: "/",
                },
              ],
            },
            {
              source: "/manifest.json",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=0, must-revalidate",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
