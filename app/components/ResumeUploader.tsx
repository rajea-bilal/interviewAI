import React, { useState } from "react";
import Chat from "./Chat";
import LoadingSpinner from "./LoadingSpinner";

const ResumeUploader = () => {
  const [showChat, setShowChat] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialText, setInitialText] = useState("");
  const [audio, setAudio] = useState("");

  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      setIsLoading(false);
      return;
    }

    // create formData object with prop 'file' and its value as file added by user
    const formData = new FormData();
    formData.append("file", file);

  
    // make a POST request to extract-text with the file
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract-text`, {
        method: "POST",
        body: formData, 
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // console.log("response from resumeUploader", response);
      // destructuring the object, extracting the text property and naming it 'extractedText'
      const { text: extractedText, audio } = await response.json();
    
      setInitialText(extractedText);
      setAudio(audio);
      setShowChat(true);
    } catch (error) {
      console.error("Error processing resume:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-16">
      <p className="text-transparent bg-gradient-to-r from-stone-500 via-stone-600 bg-clip-text animate-shine bg-[length:200%_100%] max-w-[400px] font-semibold text-4xl md:text-5xl md:max-w-[500px] text-center leading-snug md:leading-[3.8rem]">
        {!showChat ? "Upload your resume to start the interview" : "Behavioural Interview"}
      </p>
      {/* if showChat is false, show upload resume input field styled as a btn  */}
      {!showChat ? (
        <>
          <div className="border border-[#e6e0db] rounded-full cursor-pointer p-2 px-6 flex justify-center items-center text-stone-500 text-2xl hover:bg-[hsl(29,55%,69%)] hover:border-[hsl(29,55%,69%)] hover:text-stone-100 transition-all duration-300 mt-6">
            <input
              type="file"
              id="file-upload"
              onChange={handleResumeUpload}
              accept="application/pdf"
              hidden
              className="bg-red"
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer font-semibold text-xl"
            >
              {isLoading ? "Uploading resume..." : "Upload Resume"}
            </label>
          </div>
          {isLoading && <LoadingSpinner />}
        </>
      ) : (
        <Chat initialText={initialText} audioBase64={audio} resumeText={resumeText} /> 
      )}
    </div>
  );
};

export default ResumeUploader;
