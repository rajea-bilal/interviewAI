# InterviewAI 🤖

An AI-powered behavioral interview simulator that helps developers prepare for technical interviews through interactive voice conversations.

## Features
- 🎙️ Voice-based interaction for natural conversation flow
- 🤖 AI interviewer powered by GPT-4
- 🗣️ Text-to-Speech for interviewer questions
- 📝 Real-time speech-to-text conversion of your answers
- 📄 Resume-aware questioning tailored to your experience
- 🔄 Dynamic follow-up questions based on your responses

## Tech Stack
- Next.js 13 with App Router
- OpenAI GPT-4 API for intelligent interviewing
- ElevenLabs for natural Text-to-Speech
- Google Cloud Speech-to-Text for voice recognition
- Tailwind CSS for styling
- TypeScript for type safety

## How It Works
1. Upload your resume (PDF)
2. AI analyzes your experience
3. Start voice-based interview
4. Get real-time feedback and follow-up questions
5. Practice and improve your interview skills


## Getting Started

### Prerequisites
- Node.js 18+ installed
- OpenAI API key
- ElevenLabs API key
- Google Cloud API key with Speech-to-Text enabled

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/interview-ai.git
cd interview-ai
```

First, duplicate the `.env` file into a new file named `.env.local`. Update the value of your OpenAI API key there.

env
- OPENAI_API_KEY=your_openai_api_key
- ELEVENLABS_API_KEY=your_elevenlabs_api_key
-GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

The first time you are running this project, you will need to install the dependencies. Run this command in your terminal:

```bash
npm install
```


To start the app, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Usage
1. Upload your resume in PDF format
2. Allow microphone access when prompted
3. Click 'Start Recording' to answer questions
4. Click 'Stop Recording' when finished
5. Listen to the AI interviewer's follow-up questions


