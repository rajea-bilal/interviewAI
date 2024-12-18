"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
const AudioRecorder = dynamic(
  () => import('./AudioRecorder'),
  { ssr: false }
);
import LoadingSpinner from "./LoadingSpinner";
import { base64ToBlob } from "../utils/audio";
interface ChatProps {
  initialText?: string;
  audioBase64: string;
  resumeText: string;
};

type MessageType = {
  role: "user" | "assistant";
  text?: string;
  audio?: string | null;
  timestamp: number;
};



const Chat: React.FC<ChatProps> = ({ initialText, audioBase64, resumeText }) => {
  // State to manage messages

  const initialChat: MessageType = {
    role: "assistant",
    text: initialText || "Hello, I am Bob the Interviewer. How can I help you?",
    audio: audioBase64
      ? URL.createObjectURL(base64ToBlob(audioBase64, "audio/mpeg"))
      : null,
    timestamp: Date.now(),
  };

  const [chatMessages, setChatMessages] = useState<MessageType[]>([
    initialChat,
  ]);
  // To store user input
  const [newMessage, setNewMessage] = useState("");
  // To manage "AI Speaking" status
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);

  // Play audio when a new assistant message arrives with audio
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.audio) {
      const audio = new Audio(lastMessage.audio);
      setIsSpeaking(true);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
    }
  }, [chatMessages]);



  // handle user recording
  const handleUserAudio = async (mediaBlobUrl: string) => {
    setIsLoading(true);
 

    try {
      // fetching the temporary link to the audio from the browser's memory
      // raw binary data for the audio file
      const audioBlobFetch = await fetch(mediaBlobUrl);
      // binary data converted into a blob
      const audioBlob = await audioBlobFetch.blob();

      //blob added to a formData object to send it to the backend
      const formData = new FormData();
      formData.append("audio", audioBlob);
     
      // request to elevenLabs STT API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/google-cloud-stt`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transcription");
      }

      const { text: transcribedText } = await response.json();
   
    
      // add the transcription to the chat
      const userMessage: MessageType = {
        role: "user",
        audio: mediaBlobUrl,
        text: transcribedText,
        timestamp: Date.now(),
      };

      // add the user's transcribed message (audio converted to text) to the chatMessages state so it can be displayed
      setChatMessages((prev) => [...prev, userMessage]);

       console.log("Resume text in Chat component:", resumeText); // Debug l

      // extract-text endpoint expects formData
      // Get new question using ONLY resumeText
      const formDataForQuestion = new FormData();
      formDataForQuestion.append("resumeText", resumeText);

       const aiResponse = await fetch("/api/extract-text", {
      method: "POST",
      body: formDataForQuestion,
    });

    const openAIResponse = await aiResponse.json();
    // aiData contains both text (question) and audio from ElevenLabs
    console.log("AI Response data:", openAIResponse);
    // 4. Add AI's new question to chat with audio
    const openAIMessage: MessageType = {
      role: "assistant",
      text: openAIResponse.text,
      audio: openAIResponse.audio ? URL.createObjectURL(base64ToBlob(openAIResponse.audio, "audio/mpeg")) : null,
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, openAIMessage]);
     
    } catch (error) {
      console.error("Error transcribing audio", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, couldn't understand your response. Can you try again?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false); // Reset the loading state once transcription is complete
    }
  };

  return (
    <div className="max-w-2xl md:max-w-3xl flex flex-col w-full mt-6 p-x-1">
      {/* Chat Messages */}
      <div className="bg-[rgba(0,0,0,0.1)] backdrop-blur-sm  w-full overflow-y-auto p-3 rounded-lg flex flex-col gap-2 h-[400px]">
        {chatMessages.map((message, index) => (
          <div key={index} className={`flex`}>
            <div
              className={`rounded-lg ${
                message.role === "user"
                  ? " text-stone-50 text-md"
                  : " text-stone-700 text-md"
              }`}
            >
              <span className="font-bold">
                {message.role === "assistant" ? "Interviewer: " : "You: "}
                </span>
                {message.text}
              {message.role === "assistant" && isSpeaking && (
                <div className="w-[20rem] flex justify-center items-center text-xs text-stone-50 mt-4 border border-stone-100 p-1 rounded-full px-2">
                  Interviewer speaking...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="mt-4">
        <AudioRecorder handleUserAudio={handleUserAudio} />
      </div>

      {isQuestionLoading && <LoadingSpinner />}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default Chat;
