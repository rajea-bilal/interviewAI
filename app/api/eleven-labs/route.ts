import error from "next/error";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  console.log("Request Body:", req.body);
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      console.error("Invalid text payload:", text);
      return NextResponse.json(
        { status: "error", error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Payload for ElevenLabs API:", { text });

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/ErXwobaYiN019PkySvjV/stream",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error in ElevenLabs API", error);
      return NextResponse.json(
        {
          status: "error",
          error: `ElevenLabs API error: ${JSON.stringify(error)}`,
        },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // convert the audio file (binary data) into text format so it can be included in the JSON response
    // base64 encoded audio can be played directly in the browser without needing download
    // Return audio as Base64
    // Return Base64 audio
    return NextResponse.json(
      { status: "success", audio: audioBase64 },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ElevenLabs API", error);
    return NextResponse.json(
      { status: "error", error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
