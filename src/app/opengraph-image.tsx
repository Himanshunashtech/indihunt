import { ImageResponse } from "next/og";

export const alt = "IndiHunt — Discover, launch and upvote the best indie products.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/webp";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fb",
          padding: "60px",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Subtle Outer Card Frame */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "1.5px solid #e2e8f0",
            borderRadius: "32px",
            pointerEvents: "none",
          }}
        />

        {/* Center Content Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "28px",
            maxWidth: "920px",
          }}
        >
          {/* Logo Row: Magnifying Glass + indihunt */}
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            {/* SVG Logo Mark */}
            <svg width="88" height="88" viewBox="0 0 100 100" fill="none">
              {/* Black Handle */}
              <rect
                x="22"
                y="58"
                width="14"
                height="32"
                rx="7"
                transform="rotate(45 22 58)"
                fill="#1e293b"
              />
              {/* Orange Glass Ring */}
              <circle cx="56" cy="38" r="26" stroke="#ff6154" strokeWidth="14" fill="none" />
              {/* Small Orange Accent Dot */}
              <circle cx="82" cy="62" r="6" fill="#ff6154" />
            </svg>

            {/* Brand Text */}
            <span
              style={{
                fontSize: "88px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-2.5px",
                lineHeight: 1,
              }}
            >
              indi<span style={{ color: "#ff6154" }}>hunt</span>
            </span>
          </div>

          {/* Subtitle Lines */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            <p
              style={{
                fontSize: "30px",
                fontWeight: 600,
                color: "#334155",
                margin: 0,
                lineHeight: 1.35,
                letterSpacing: "-0.5px",
              }}
            >
              Discover, launch and upvote the best indie products.
            </p>
            <p
              style={{
                fontSize: "30px",
                fontWeight: 600,
                color: "#334155",
                margin: 0,
                lineHeight: 1.35,
                letterSpacing: "-0.5px",
              }}
            >
              Built by makers, for makers.
            </p>
          </div>

          {/* Red/Orange Callout Prompt */}
          <p
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#ff6154",
              margin: 0,
              marginTop: "10px",
              letterSpacing: "-0.5px",
            }}
          >
            Will you discover the next big thing?
          </p>
        </div>

        {/* Bottom Left Badge: indihunt.in */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            left: "48px",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "14px",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          indihunt.in
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
