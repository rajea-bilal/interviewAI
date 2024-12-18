"use client";

import { ReactMediaRecorder } from "react-media-recorder";
import React, { useState } from "react";

interface AudioRecorderProps {
  // prop will be a function that takes in a single param (mediaBlogUrl) which is a string and doesn't return anything
  handleUserAudio: (mediaBlobUrl: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ handleUserAudio }) => {
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [audioURL, setAudioURL] = useState("");

  const onStopRecording = (mediaBlobUrl: string) => {
    // mediBlobUrl is a temporary link to the user's audio stored in the browser's memory
    setRecordingStatus("stopped");
    setAudioURL(mediaBlobUrl);
    handleUserAudio(mediaBlobUrl);
  };
  return (
    <div className="">
      <ReactMediaRecorder
        audio
        onStart={() => setRecordingStatus("recording")}
        onStop={onStopRecording}
        render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
          <div>
            <p className="text-stone-700 ml-2 mt-2">Status: {status}</p>
            <div className=" flex gap-4 mt-2 mb-4">
              <button
                className=" p-2 px-6 font-semibold rounded-full bg-[rgba(0,0,0,0.1)] backdrop-blur-sm text-stone-600 cursor-pointer hover:bg-[#e3b893]"
                onClick={startRecording}
              >
                Start Recording
              </button>
              <button
                className="p-2 px-6 font-semibold rounded-full bg-[rgba(0,0,0,0.1)] backdrop-blur-sm text-stone-600 cursor-pointer hover:bg-[#e3b893]"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            </div>
            {mediaBlobUrl && (
              <audio src={mediaBlobUrl} 
              controls 
              className="mt-4 w-full h-8 invert backdrop-blur-sm rounded-full opacity-65">
                Your browser does not support the audio element
              </audio>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default AudioRecorder;
