import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Base K:Amplify — kamplify.team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0c0a09, #1a1510, #0c0a09)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Fire icon — large campfire emoji as fallback since we can't embed SVG in OG */}
        <div style={{ fontSize: 180, marginBottom: 10, display: "flex" }}>🔥</div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#e8e0d8",
            marginBottom: 16,
            display: "flex",
          }}
        >
          Base K:Amplify
        </div>

        {/* URL with goat */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ color: "#E67E22" }}>kamplify.team</span>
          <span style={{ fontSize: 48 }}>🐐</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#8b8b9e",
            marginTop: 20,
            display: "flex",
          }}
        >
          Our climb to 501K hours saved
        </div>
      </div>
    ),
    { ...size },
  );
}
