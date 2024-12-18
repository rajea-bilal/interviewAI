import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Create an OpenAI API client with explicit configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1", // explicitly set the base URL
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { messages, resumeText } = await req.json();
     console.log("Resume received in OpenAI route:", resumeText?.substring(0, 100) + "...");

    const conversationWithResume = [
      {
        role: "system",
        content: `You are Bob, an expert at conducting a behavioral interview. 

        CONTEXT FROM RESUME: ${resumeText}

        IMPORTANT INSTRUCTIONS:
        - Ask only ONE behavioral question at a time
        - Each question should be unique and independent
        - Questions MUST be based on specific experiences mentioned in their resume`
      },
      ...messages  // Keep the existing messages from the request
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: conversationWithResume,
      stream: true,
      temperature: 0.7,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        details: error.toString(),
        status: error.status || 500
      }),
      { 
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
