import * as pdfjs from 'pdfjs-dist';
import { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import { NextResponse, NextRequest } from "next/server";

if (typeof window !== "undefined") {
  import("pdfjs-dist/build/pdf.worker.mjs");
}
// structure of textContent
// hasEOL - whether the text ends with a new line
// {
//   items: [
//     { str: "Hello", hasEOL: false },
//     { str: "world", hasEOL: true },
//     { str: "This is PDF text.", hasEOL: false },
//   ];
// }
// combines text pieces from a PDF into a single, long string
function mergeTextContent(textContent: TextContent) {
  const itemsArray = textContent.items;
  const mergedTextPieces = itemsArray.map((item) => {
    const { str, hasEOL } = item as TextItem;

    return hasEOL ? `${str}\n` : str;
  });
  // join all the processed pieces of text into a single string
  return mergedTextPieces.join("");
}

// talk to openAI API
async function fetchOpenAIResponse(
  resumeText: string | null,
  previousAnswers: string | null
) {

  const payload = {
    messages: [
      {
        role: "user",
        content: "Generate a new behavioral interview question based on the resume"
      }
    ],
    resumeText: resumeText
  }
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openai-gpt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  // getReader() part of the Streams API in JS, used to read a ReadableStream.
  // response.body is a ReadableStream sent back from the openai API
  // allows you to read the body of the HTTP response incrementally, chunk by chunk
  // reader object that can read the stream in chunks using the read() method
  const reader = response.body.getReader();
  let chunks = [];

  // Read the stream until theres no more data
  while (true) {
    const { done, value } = await reader.read();
    // value is the current piece of ata
    // done is true when data/reading finishes
    if (done) {
      break;
    }
    chunks.push(value);
  }

  // Convert the Uint8Array chunks to string
  const decoder = new TextDecoder("utf-8");
  // mapping over the chunks array and converting each chunk into text using the decode()
  // join all the pieces together to make a single string of text
  const text = chunks.map((chunk) => decoder.decode(chunk)).join("");

  return text;
}

//talk to ElevenLabs API
async function fetchElevenLabsResponse(openAIResponse: string) {
  // Validate the input
  if (
    !openAIResponse ||
    typeof openAIResponse !== "string" ||
    openAIResponse.trim() === ""
  ) {
    console.error("Invalid text for ElevenLabs:", openAIResponse);
    throw new Error("Invalid text provided to ElevenLabs API");
  }

  // Prepare the payload
  const payload = { text: openAIResponse };
  // console.log("Payload to ElevenLabs:", payload);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/eleven-labs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error response from ElevenLabs API:", errorResponse);
      throw new Error(
        `ElevenLabs API error: ${response.status} - ${JSON.stringify(
          errorResponse
        )}`
      );
    }

    const data = await response.json();
    return data.audio;
  } catch (error) {
    console.error("Error in fetchElevenLabsResponse", error);
    throw error;
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

 
  try {
    //extract the file coming as formData from the ResumeUploader Component
    const formData = await req.formData();
    // console.log("resume received in the extract-text as formData", formData);
    // .getAll method returns all the values associated with the key "file"
    // .getAll method returns an array of file Objects, if theres only one file uploaded then we'll have just thta one file
    const [file] = formData.getAll("file") as unknown as File[];
    const resumeText = formData.get("resumeText") as string;
   
      console.log("Resume text in extract-text route:", resumeText); // Debug log

    let openAIResponse;
    let elevenLabResponse;

    if (file) {
      // console.log("Received file:", file);
      // pdf.js requires the file/pdf in its raw binary form. We use arrayBuffer() to convert it into such
      // arrayBuffer comes from the File API in JS
      const fileBuffer = await file.arrayBuffer();
      // converts raw binary data into an array-like structure that cam be indexed
      // Uint8Array allows you to efficiently process binary data
      const fileData = new Uint8Array(fileBuffer);

      // import the worker script needed to process the pdf
      await import("pdfjs-dist/build/pdf.worker.mjs");

      // Load the PDF from the buffer
      const loadingTask = pdfjs.getDocument({ data: fileData });
      // wait until the pdf is fully loaded
      // pdf is the fully loaded pdf document
      const pdf = await loadingTask.promise;

      if (!pdf.numPages) {
        return new Response(JSON.stringify({ status: "ok", text: null }), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      // get the first page from the loaded pdf
      const page = await pdf.getPage(1);
      // extracts all the text from the page object using getTextContent method
      // returns the textContent object that has an items array (each item is an object within this array)
      const textContent = await page.getTextContent();
      // resumeText is a single string of text from the first page of pdf
      const resumeText = mergeTextContent(textContent);
      //  console.log("Extracted resume text:", resumeText)

      openAIResponse = await fetchOpenAIResponse(resumeText, null);
    

      if (openAIResponse) {
        // Send openAIResponse (text) to elevenLabs API to get the base64 audio
        elevenLabResponse = await fetchElevenLabsResponse(openAIResponse);
      }
      return new Response(
        JSON.stringify({
          status: "ok",
          text: openAIResponse,
          audio: elevenLabResponse,
          resumeText: resumeText,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      
    
      const resumeText = formData.get("resumeText") as string;  // Get resumeText from formData
      console.log("Resume text for next question:", resumeText);
      // Get new question from OpenAI
      openAIResponse = await fetchOpenAIResponse(resumeText, null);
      // Get audio from ElevenLabs
      elevenLabResponse = await fetchElevenLabsResponse(openAIResponse);

      return new Response(
        JSON.stringify({
          status: "ok",
          text: openAIResponse,
          audio: elevenLabResponse,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } 
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", error: String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
