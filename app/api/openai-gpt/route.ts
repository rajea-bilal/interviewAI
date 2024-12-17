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
      {
        role: "system",
        content: `You are an expert technical interviewer conducting a behavioral interview for a software engineering position. 

Your task is to:
1. Analyze the candidate's resume to understand their experience, skills, and projects
2. Ask engaging behavioral questions that relate to their specific experience
3. Vary between technical and soft-skill questions based on their responses
4. Ask ONE question at a time and wait for the response

Guidelines:
- Generate questions based on actual projects and technologies mentioned in their resume
- Mix between different areas: technical challenges, collaboration, leadership, problem-solving
- Keep the conversation natural and flowing, not following a rigid structure
- Ensure questions are specific to their experience, not generic
- Avoid repeating topics that have been well covered

Remember: You're having a professional conversation, not following a script. Each question should naturally flow from their resume and previous answers.`
      },
      {
        role: "user",
        content: `Resume: ${resumeText}`
      },
      ...messages
    ]

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
