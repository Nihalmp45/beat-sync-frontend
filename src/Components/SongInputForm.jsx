import React, { useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:4000";

export default function SongInputForm() {
  const [promptText, setPromptText] = useState("");
  const [script, setScript] = useState("");
  const [shortenedScript, setShortenedScript] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitlesUrl, setSubtitlesUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [animationEffect, setAnimationEffect] = useState("fade-in"); // New state for animation

  const handleGenerateScript = async () => {
    if (!promptText) {
      alert("Please enter a prompt for video generation.");
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    setStatus("Generating script...");

    try {
      const response = await axios.post(`${BASE_URL}/api/video/generate-script`, { prompt: promptText });
      setScript(response.data.script);
      setShortenedScript(generateShortenedScript(response.data.script));

      setStatus("Script generated, feel free to edit it.");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate script.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateShortenedScript = (fullScript) => {
    const maxLength = 300;
    return fullScript.length > maxLength ? fullScript.substring(0, maxLength) + "..." : fullScript;
  };

  const handleGenerateVideo = async () => {
    if (!script) {
      alert("Please edit the script before submitting.");
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    setSubtitlesUrl("");
    setStatus("Submitting for video generation...");

    try {
      const response = await axios.post(`${BASE_URL}/api/video/generate-video`, {
        prompt: script,
        animationEffect, // Send animation effect
      });

      pollVideoStatus(response.data.uuid);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to queue video generation.");
      setIsLoading(false);
    }
  };

  const pollVideoStatus = async (uuid) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/video/video-status?uuid=${uuid}`);

      if (response.data.status === "success" && response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl);
        setSubtitlesUrl(generateSubtitlesUrl(shortenedScript));
        setStatus("Video generated successfully!");
        setVideoGenerated(true);
        setIsLoading(false);
      } else {
        setTimeout(() => pollVideoStatus(uuid), 600000);
      }
    } catch (error) {
      console.error("Error polling video status:", error);
      setStatus("Error checking video status.");
      setIsLoading(false);
    }
  };

  const generateSubtitlesUrl = (shortenedScript) => {
    const subtitleContent = `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${shortenedScript}\n`;
    return URL.createObjectURL(new Blob([subtitleContent], { type: "text/vtt" }));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold">Generate AI Video 🎥</h1>

      <textarea
        className="w-full max-w-xl h-32 p-4 rounded-lg bg-gray-800 border border-gray-700"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Enter your video idea..."
      />

      <button
        className="mt-4 py-3 text-lg font-semibold bg-blue-600 rounded-lg"
        onClick={handleGenerateScript}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Script"}
      </button>

      {script && (
        <>
          <textarea
            className="w-full h-40 p-4 mt-6 bg-gray-800 border border-gray-700"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
          <label className="mt-4">Animation Effect:</label>
          <select
            className="p-2 bg-gray-800 border border-gray-700"
            value={animationEffect}
            onChange={(e) => setAnimationEffect(e.target.value)}
          >
            <option value="fade-in">Fade In</option>
            <option value="zoom">Zoom</option>
            <option value="motion-blur">Motion Blur</option>
          </select>
          <button className="mt-4 py-3 text-lg font-semibold bg-green-600 rounded-lg" onClick={handleGenerateVideo}>
            {isLoading ? "Generating..." : "Generate Video"}
          </button>
        </>
      )}

      {videoUrl && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Generated Video 🎥</h2>
          <video controls className="w-full">
            <source src={videoUrl} type="video/mp4" />
            {subtitlesUrl && <track src={subtitlesUrl} kind="subtitles" label="English" default />}
          </video>
        </div>
      )}
    </div>
  );
}





























// import React, { useState } from "react";

// const BASE_URL = "http://localhost:4000";

// export default function SongInputForm() {
//   const [promptText, setPromptText] = useState("");
//   const [script, setScript] = useState("");
//   const [shortenedScript, setShortenedScript] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");
//   const [subtitlesUrl, setSubtitlesUrl] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [status, setStatus] = useState("");
//   const [videoGenerated, setVideoGenerated] = useState(false);

//   const handleGenerateScript = async () => {
//     if (!promptText) {
//       alert("Please enter a prompt for video generation.");
//       return;
//     }

//     setIsLoading(true);
//     setVideoUrl("");
//     setStatus("Generating script...");

//     try {
//       const scriptResponse = await fetch(`${BASE_URL}/api/video/generate-script`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: promptText }),
//       });

//       const scriptData = await scriptResponse.json();
//       if (!scriptResponse.ok || !scriptData.script) {
//         throw new Error(scriptData.error || "Failed to generate script.");
//       }

//       const generatedScript = scriptData.script;
//       setScript(generatedScript);
//       setShortenedScript(generateShortenedScript(generatedScript));

//       setStatus("Script generated, feel free to edit it.");
//       setIsLoading(false);
//     } catch (error) {
//       console.error("Error:", error);
//       alert(error.message);
//       setIsLoading(false);
//     }
//   };

//   const generateShortenedScript = (fullScript) => {
//     const maxLength = 300;
//     return fullScript.length > maxLength ? fullScript.substring(0, maxLength) + "..." : fullScript;
//   };

//   const handleGenerateVideo = async () => {
//     if (!script) {
//       alert("Please edit the script before submitting.");
//       return;
//     }

//     setIsLoading(true);
//     setVideoUrl("");
//     setSubtitlesUrl("");
//     setStatus("Submitting for video generation...");

//     try {
//       const videoResponse = await fetch(`${BASE_URL}/api/video/generate-video`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: script }),
//       });

//       const videoData = await videoResponse.json();
//       if (!videoResponse.ok || !videoData.uuid) {
//         throw new Error(videoData.error || "Failed to queue video generation.");
//       }

//       pollVideoStatus(videoData.uuid);
//     } catch (error) {
//       console.error("Error:", error);
//       alert(error.message);
//       setIsLoading(false);
//     }
//   };

//   const pollVideoStatus = async (uuid) => {
//     try {
//       const statusResponse = await fetch(`${BASE_URL}/api/video/video-status?uuid=${uuid}`);
//       const statusData = await statusResponse.json();

//       if (statusData.status === "success" && statusData.videoUrl) {
//         setVideoUrl(statusData.videoUrl);
//         setSubtitlesUrl(generateSubtitlesUrl(shortenedScript));
//         setStatus("Video generated successfully!");
//         setVideoGenerated(true);
//         setIsLoading(false);
//       } else {
//         setStatus(statusData.status);
//         setTimeout(() => pollVideoStatus(uuid), 600000);
//       }
//     } catch (error) {
//       console.error("Error polling video status:", error);
//       setStatus("Error checking video status.");
//       setIsLoading(false);
//     }
//   };

//   const generateSubtitlesUrl = (shortenedScript) => {
//     const subtitleContent = `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${shortenedScript}\n`;
//     const subtitleFile = new Blob([subtitleContent], { type: "text/vtt" });
//     return URL.createObjectURL(subtitleFile);
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
//       <h1 className="text-4xl font-bold text-center mb-6">Generate AI Video 🎥</h1>
  
//       <textarea
//         className="w-full max-w-xl h-32 text-lg p-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-lg"
//         value={promptText}
//         onChange={(e) => setPromptText(e.target.value)}
//         placeholder="Enter your video idea... and generate script"
//       />
  
//       <button
//         className={`w-full max-w-xs mt-4 py-3 text-lg font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 transition-transform transform hover:scale-105 ${
//           isLoading ? "opacity-50 cursor-not-allowed" : ""
//         }`}
//         onClick={handleGenerateScript}
//         disabled={isLoading}
//       >
//         {isLoading ? "Generating..." : "Generate Script"}
//       </button>
  
//       {status && <p className="text-lg text-gray-400 mt-4">{status}</p>}
//       {isLoading && <p className="text-lg text-gray-400 mt-4">Loading...</p>}
  
//       {script && (
//         <div className="w-full max-w-xl mt-6">
//           <h3 className="text-2xl font-semibold mb-2">Edit Script</h3>
//           <textarea
//             className="w-full h-40 text-lg p-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-lg"
//             value={script}
//             onChange={(e) => setScript(e.target.value)}
//           />
//           <button
//             className={`w-full max-w-xs mt-4 py-3 text-lg font-semibold rounded-lg bg-green-600 hover:bg-green-500 transition-transform transform hover:scale-105 ${
//               isLoading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             onClick={handleGenerateVideo}
//             disabled={isLoading}
//           >
//             {isLoading ? "Generating Video ...please hold on!" : "Generate Video"}
//           </button>
//         </div>
//       )}
  
//       {videoUrl && (
//         <div className="w-full max-w-2xl flex flex-col items-center mt-6">
//           <h2 className="text-2xl font-semibold mb-4">Generated Video 🎥</h2>
//           <video controls className="w-full rounded-lg shadow-lg border border-gray-700">
//             <source src={videoUrl} type="video/mp4" />
//             {subtitlesUrl && (
//               <track src={subtitlesUrl} kind="subtitles" label="English" default />
//             )}
//             Your browser does not support the video tag.
//           </video>
//           {videoGenerated && (
//             <button
//               className="mt-4 px-6 py-3 text-lg font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-transform transform hover:scale-105"
//               onClick={handleDownloadVideo}
//             >
//               Download Video
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
  
// }
