import error from "next/error";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_CLOUD_API_KEY) {
    console.error("Google Cloud API Key is not set");
    return NextResponse.json(
      { status: "error", error: "API configuration error" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { status: "error", error: "Audio file missing" },
        { status: 400 }
      );
    }

     console.log("Audio file type:", audioFile.type);  // Add this log
    console.log("Audio file size:", audioFile.size);  // Add this log

    const audioBlob = await audioFile.arrayBuffer();
    const audioBytes = Buffer.from(audioBlob).toString("base64");

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            encoding: "MP3",
            sampleRateHertz: 48000,
            languageCode: "en-US",
              enableAutomaticPunctuation: true,  
            model: "default",  
            useEnhanced: true,  
          },
          audio: {
            content: audioBytes,
          },
        }),
      }
    );

    const data = await response.json();
        console.log("Google API full response:", data);  // Add this to see full response

     const transcribedText = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript ?? '')
      .join(' ');

    return NextResponse.json({
      status: "success",
      text: transcribedText || "No transcription available",
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
