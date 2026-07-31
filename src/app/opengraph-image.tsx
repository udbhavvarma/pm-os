import { ImageResponse } from "next/og";

export const alt = "Auxiliaire — Decision memory for product builders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#171713", color: "#f0e8d8", padding: "68px 76px", fontFamily: "Georgia" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28 }}>
        <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #71836a", borderRadius: 14, color: "#8daa82" }}>A</div>
        Auxiliaire
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 960 }}>
        <div style={{ fontSize: 72, lineHeight: 1.08 }}>Decision memory for product builders.</div>
        <div style={{ fontFamily: "Arial", color: "#b9b1a4", fontSize: 30, lineHeight: 1.35 }}>Capture the evidence. Keep the next step connected. Return to what actually happened.</div>
      </div>
      <div style={{ display: "flex", gap: 12, fontFamily: "Arial", fontSize: 21, color: "#8daa82" }}>CAPTURE <span style={{ color: "#6f6b62" }}>→</span> DECIDE <span style={{ color: "#6f6b62" }}>→</span> ACT <span style={{ color: "#6f6b62" }}>→</span> LEARN</div>
    </div>,
    size,
  );
}
