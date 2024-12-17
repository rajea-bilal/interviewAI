"use client";

import Image from "next/image";
import ResumeUploader from "./components/ResumeUploader";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen min-w-full bg-gradient-to-r from-[#c5c4c4] via-[#E2C2A4] to-[#c5c4c4] flex justify-center items-center px-4 py-4">
      <div className="container">
        <div className="flex justify-center items-center">
          <Link href="/" onClick={() => {
            window.location.reload();
          }}>
            <Image
              src="/interview-logo.png"
              alt="InterviewGPT logo"
              width="400"
              height="75"
            />
          </Link>
        </div>
        <ResumeUploader />
      </div>
    </main>
  );
}
