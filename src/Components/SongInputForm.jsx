import { useState } from "react";
import axios from "axios";

const BASE_URL = "https://beat-sync-backend-jcsc.onrender.com";

// http://localhost:4000

export default function SongInputForm() {
  const [promptText, setPromptText] = useState("");
  const [script, setScript] = useState("");
  const [shortenedScript, setShortenedScript] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitlesUrl, setSubtitlesUrl] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [status, setStatus] = useState("");
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [animationStyle, setAnimationStyle] = useState("fade-in");
  const [aspectRatio, setAspectRatio] = useState("landscape");

  const handleGenerateScript = async () => {
    if (!promptText.trim()) {
      alert("Please enter a prompt for video generation.");
      return;
    }

    setIsGeneratingScript(true);
    setStatus("Generating script...");

    try {
      const response = await axios.post(
        `${BASE_URL}/api/video/generate-script`,
        {
          prompt: promptText,
        }
      );

      const generatedScript = response.data.script;
      setScript(generatedScript);
      setShortenedScript(generateShortenedScript(generatedScript));

      setStatus("Script generated! Feel free to edit.");
    } catch (error) {
      console.error("Error generating script:", error);
      setStatus("Failed to generate script.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateShortenedScript = (fullScript) => {
    const maxLength = 300;
    return fullScript.length > maxLength
      ? `${fullScript.substring(0, maxLength)}...`
      : fullScript;
  };

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      alert("Please edit the script before generating.");
      return;
    }

    setIsGeneratingVideo(true);
    setStatus("Submitting video generation request...");

    try {
      const response = await axios.post(
        `${BASE_URL}/api/video/generate-video`,
        {
          prompt: script,
          aspectRatio, // Send aspect ratio instead of subtitle color
          animationStyle,
        }
      );

      pollVideoStatus(response.data.uuid);
    } catch (error) {
      console.error("Error submitting video generation request:", error);
      setStatus("Failed to queue video generation.");
      setIsGeneratingVideo(false);
    }
  };

  const pollVideoStatus = async (uuid, attempt = 0) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/video/video-status?uuid=${uuid}`
      );

      if (
        response.data.status === "success" &&
        response.data.processedVideoUrl
      ) {
        setVideoUrl(response.data.processedVideoUrl);
        setSubtitlesUrl(generateSubtitlesUrl(shortenedScript));
        setStatus("✅ Video generated successfully!");
        setVideoGenerated(true);
        setIsGeneratingVideo(false);
      } else if (response.data.status === "processing") {
        setStatus(`⏳ Processing video... (${response.data.progress}%)`);
        setTimeout(() => pollVideoStatus(uuid, attempt + 1), 400000);
      } else if (attempt < 20) {
        setStatus("⏳ Waiting for video generation...");
        setTimeout(() => pollVideoStatus(uuid, attempt + 1), 400000);
      } else {
        setStatus("❌ Video generation timeout. Try again.");
        setIsGeneratingVideo(false);
      }
    } catch (error) {
      console.error("Error polling video status:", error);
      setStatus("❌ Error checking video status.");
      setIsGeneratingVideo(false);
    }
  };

  const generateSubtitlesUrl = (shortenedScript) => {
    const subtitleContent = `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${shortenedScript}\n`;
    return URL.createObjectURL(
      new Blob([subtitleContent], { type: "text/vtt" })
    );
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = "generated_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = (platform) => {
    if (!videoUrl) return;

    const encodedUrl = encodeURIComponent(videoUrl);
    const shareLinks = {
      whatsapp: `https://wa.me/?text=Check%20out%20this%20AI-generated%20video!%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=Check%20out%20this%20AI-generated%20video!&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    if (platform === "instagram") {
      alert("Instagram sharing requires manual upload.");
    } else {
      window.open(shareLinks[platform], "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">Generate AI Video 🎥</h1>

      <textarea
        className="w-full max-w-xl h-32 p-4 rounded-lg bg-gray-800 border border-gray-700"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Enter your video idea..."
      />

      <button
        className="mt-4 py-3 px-4 text-lg font-semibold bg-blue-600 rounded-lg"
        onClick={handleGenerateScript}
        disabled={isGeneratingScript}
      >
        {isGeneratingScript ? "Generating..." : "Generate Script"}
      </button>

      {script && (
        <>
          <textarea
            className="w-full h-40 p-4 mt-6 bg-gray-800 border border-gray-700"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
          {status && (
            <div className="mt-4 p-3 bg-gray-800 text-white rounded-lg">
              {status}
            </div>
          )}
          <label className="mt-4">Video Effect:</label>
          <select
            className="p-2 bg-gray-800 border border-gray-700"
            value={animationStyle}
            onChange={(e) => setAnimationStyle(e.target.value)}
          >
            <option value="fade-in">Fade In</option>
            <option value="zoom">Fade Out</option>
          </select>

          <label className="mt-4">Select Video Orientation:</label>
          <select
            className="p-2 bg-gray-800 border border-gray-700"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            <option value="landscape">Landscape 📺 (16:9) </option>
            <option value="portrait">Portrait 📱 (9:16)</option>
          </select>

          <button
            className="mt-4 py-3 px-4 text-lg font-semibold bg-green-600 rounded-lg"
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo}
          >
            {isGeneratingVideo ? "Generating..." : "Generate Video"}
          </button>
          {/* Status Message */}
          
        </>
      )}

      {videoUrl && (
        <>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Generated Video 🎥</h2>
            <video controls className="w-full">
              <source src={videoUrl} type="video/mp4" />
              {subtitlesUrl && (
                <track
                  src={subtitlesUrl}
                  kind="subtitles"
                  label="English"
                  default
                />
              )}
            </video>
          </div>
          <button
            className="mt-4 py-2 px-6 bg-blue-600 rounded-lg"
            onClick={handleDownload}
          >
            Download Video
          </button>

          <div className="mt-4 flex space-x-4">
            <button
              className="py-2 px-4 bg-green-600 rounded-lg"
              onClick={() => handleShare("whatsapp")}
            >
              Share on WhatsApp
            </button>
            <button
              className="py-2 px-4 bg-blue-500 rounded-lg"
              onClick={() => handleShare("facebook")}
            >
              Share on Facebook
            </button>
            <button
              className="py-2 px-4 bg-sky-500 rounded-lg"
              onClick={() => handleShare("twitter")}
            >
              Share on Twitter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
