import React from "react";

export default function LoadingState({ text = "Loading..." }) {
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "#666" }}>{text}</div>
    </div>
  );
}
