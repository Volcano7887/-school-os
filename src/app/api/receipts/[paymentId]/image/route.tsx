/* eslint-disable react-hooks/error-boundaries -- this JSX is consumed
   synchronously by Satori inside ImageResponse, not rendered by React;
   this is Next.js's own documented ImageResponse pattern. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// TEMPORARY diagnostic — testing custom font loading in isolation.
export async function GET() {
  try {
    const fontRegular = await readFile(
      join(process.cwd(), "src/assets/fonts/Roboto-Regular.woff")
    );

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
            fontFamily: "Roboto",
          }}
        >
          Test
        </div>
      ),
      {
        width: 400,
        height: 300,
        fonts: [{ name: "Roboto", data: fontRegular, weight: 400, style: "normal" }],
      }
    );
  } catch (e) {
    return Response.json(
      { stage: "font-test", error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
