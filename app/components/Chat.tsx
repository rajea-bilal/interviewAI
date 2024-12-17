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

  const generateSubsequentQuestion = async (formData: FormData) => {
    setIsQuestionLoading(true);
    // send it to the openAI and generate another question 
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract-text`, {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("Failed to generate follow-up question");
      }

      // Assuming the response is a simple text, read it directly
      const responseData = await response.json();
      const followUpQuestion = responseData.text; 

        // Generate audio for the follow-up question
    const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/eleven-labs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: followUpQuestion }),
    });

    const audioData = await audioResponse.json();

      // Create a new assistant message with both text and audio
    const newAssistantMessage: MessageType = {
      role: "assistant",
      text: followUpQuestion,
      audio: audioData.audio ? URL.createObjectURL(base64ToBlob(audioData.audio, "audio/mpeg")) : null,
      timestamp: Date.now(),
    };

      // console.log("Follow-up question generated:", newAssistantMessage);

      // add the subsequent question to the Chat state
      setChatMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error generating follow-up question", error);
    } finally {
      setIsQuestionLoading(false);
    }
  };

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
      formData.append("resumeText", resumeText);
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

      //extract-text endpoint expects formData
      const formDataForText = new FormData();
      formDataForText.append("previousAnswers", transcribedText);
      formDataForText.append("resumeText", resumeText);
      generateSubsequentQuestion(formDataForText);
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
    <div className="max-w-2xl md: max-w-3xl flex flex-col w-full rounded-full mt-6 p-x-1">
      {/* Chat Messages */}
      <div className="bg-[rgba(0,0,0,0.1)] backdrop-blur-sm flex-1 w-full overflow-y-auto p-3 rounded-lg flex flex-col gap-2">
        {chatMessages.map((message, index) => (
          <div key={index} className={`flex`}>
            <div
              className={`rounded-lg ${
                message.role === "user"
                  ? " text-stone-50 text-sm"
                  : " text-stone-700 text-sm"
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
      <div className="">
        <AudioRecorder handleUserAudio={handleUserAudio} />
      </div>

      {isQuestionLoading && <LoadingSpinner />}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default Chat;
