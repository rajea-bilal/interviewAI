// receives base64 string and returns a Blob
// converts base64 to raw binary data
// returns a number array for each character of binary data
// puts the numbers array into a special array for audio
// creates a Blob from the special array
export const base64ToBlob = (base64: string, mimeType: string) => {
  const binaryString = window.atob(base64);
  
  // Step 1: Convert binary string to array of numbers
  const numberArray = Array.from(binaryString).map(char => char.charCodeAt(0));
  
  // Step 2: Create special array for audio data
  const bytes = new Uint8Array(numberArray);
  
  return new Blob([bytes], { type: mimeType });
};
