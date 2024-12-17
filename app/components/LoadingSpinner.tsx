import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div
        className="w-16 h-16 border-stone-100 border-8 border-t-[hsl(30,65%,60%)] border-solid rounded-full animate-spin mt-4 mb-4"
        role="status"
        aria-label="loading"
      ></div>
      <p className="text-sm"></p>
    </div>
  );
};

export default LoadingSpinner;
