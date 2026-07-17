/* eslint-disable react-hooks/error-boundaries -- this JSX is consumed
   synchronously by Satori inside ImageResponse, not rendered by React;
   this is Next.js's own documented ImageResponse pattern. */
import { ImageResponse } from "next/og";

// TEMPORARY diagnostic — isolating whether ImageResponse works at all in
// this environment before re-adding real receipt data + fonts.
export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            fontSize: 60,
            color: "black",
          }}
        >
          Test
        </div>
      ),
      { width: 400, height: 300 }
    );
  } catch (e) {
    return Response.json(
      { stage: "minimal-image-response", error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
