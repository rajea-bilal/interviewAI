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

    const conversationWithResume = [
      // instructions for the AI
         {
        role: "system",
        content: `You are an expert interviewer. You specialize in conducting behavioral interviews for software engineers.
In the first message, you will receive a text of a user's resume. IMPORTANT: Ask only ONE question at a time and wait for the candidate's response before asking the next one. Ask exactly 6 questions in this order:
        1. Technical implementation
        2. Team collaboration
        3. Leadership experience
        4. Problem-solving
        5. Learning/growth
        6. Career goals
        Never repeat topics or ask follow-ups.
        `
      },
    
      {
        role: "user",
        content: `Resume: ${resumeText}`
      },
      ...messages
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview", // Changed from gpt-4-1106-preview
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
