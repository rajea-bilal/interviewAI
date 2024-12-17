import error from "next/error";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest, res: NextResponse) {
  if (!process.env.GOOGLE_CLOUD_API_KEY) {
    console.error("Google Cloud API Key is not set");
    return NextResponse.json(
      { status: "error", error: "API configuration error" },
      { status: 500 }
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  try {
    //parse the formData from the frontend
    const formDataReceived = await req.formData();

    // Log the entire FormData object
    console.log("Received FormData:", formDataReceived);

    //access audio file as raw binary data
    const audioFile = formDataReceived.get("audio");

    // handle audio file issues
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { status: "error", error: "Audio file missing" },
        { status: 400 }
      );
    }

    // Add these debug logs
    console.log("Audio MIME type:", audioFile.type);
    console.log("Audio size (bytes):", audioFile.size);

    if (audioFile.size > 10 * 1024 * 1024) {  // 10MB limit
      return NextResponse.json(
        { status: "error", error: "Audio file too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Log the audio file object
    console.log("Extracted Audio File:", audioFile);

    // Near the start of the try block
    console.log("Audio format:", audioFile.type);
    console.log("Audio size:", audioFile.size);

    // Step 2: Send audio to Google Cloud Speech-to-Text API
    const audioBlob = await audioFile.arrayBuffer();
    const audioBytes = Buffer.from(audioBlob).toString("base64");

    console.log("Audio file details:", audioFile);
    console.log("Base64 encoded audio size:", audioBytes.length);

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS", 
            sampleRateHertz: 48000,
            languageCode: "en-US",
            model: "default",
            useEnhanced: true,
          },
          audio: {
            content: audioBytes, 
          },
        }),
      }
    );

    // Add error handling for non-200 responses
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { 
          status: "error", 
          error: `Google API Error: ${response.status}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const responseBody = await response.json();
    // console.log("Response from Google Cloud API:", responseBody);
    // Step 4: Handle the response and extract transcribed text

    if (
      responseBody &&
      responseBody.results &&

      responseBody.results.length > 0
    ) {
      // Extract the transcribed text from the response
      const transcribedText = responseBody.results
        .map((result: any) => result.alternatives[0].transcript) 
        .join(" "); 
      console.log("Transcribed Text:", transcribedText);

      return NextResponse.json({
        status: "success",
        text: transcribedText,
      });
    } else {
      // Handle case where no transcription is available
      return NextResponse.json(
        { error: "No transcription available" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Google Speech-to-Text API:", error);
    return NextResponse.json(
      { 
        status: "error", 
        error: "Failed to process audio",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
