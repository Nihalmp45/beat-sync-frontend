import React, { useState } from "react";

const BASE_URL = "https://beat-sync-backend-3.onrender.com";

export default function SongInputForm() {
  const [promptText, setPromptText] = useState("");
  const [script, setScript] = useState(""); // Define the script state here
  const [shortenedScript, setShortenedScript] = useState(""); // State for shortened script
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitlesUrl, setSubtitlesUrl] = useState(""); // State for subtitle URL
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [videoGenerated, setVideoGenerated] = useState(false); // Track if video is generated

  const handleGenerateScript = async () => {
    if (!promptText) {
      alert("Please enter a prompt for video generation.");
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    setStatus("Generating script...");

    try {
      // Step 1: Generate a script using ChatGPT
      const scriptResponse = await fetch(
        `${BASE_URL}/api/video/generate-script`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText }),
        }
      );

      const scriptData = await scriptResponse.json();
      if (!scriptResponse.ok || !scriptData.script) {
        throw new Error(scriptData.error || "Failed to generate script.");
      }

      const generatedScript = scriptData.script;
      setScript(generatedScript); // Set the script in state for editing

      // Step 2: Create a shortened version of the script for subtitles
      const shortenedVersion = generateShortenedScript(generatedScript);
      setShortenedScript(shortenedVersion); // Set the shortened script for subtitles

      setStatus("Script generated, feel free to edit it.");
      setIsLoading(false); // Allow video generation only after script is edited
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
      setIsLoading(false);
    }
  };

  const generateShortenedScript = (fullScript) => {
    // Here we generate a shorter version of the script, this could be a truncation or summary
    const maxLength = 300; // Limit the length to 300 characters for the subtitle
    if (fullScript.length > maxLength) {
      return fullScript.substring(0, maxLength) + "...";
    }
    return fullScript;
  };

  const handleGenerateVideo = async () => {
    if (!script) {
      alert("Please edit the script before submitting.");
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    setSubtitlesUrl(""); // Clear subtitles URL
    setStatus("Submitting for video generation...");

    try {
      // Step 3: Send the edited script to the video generation API
      const videoResponse = await fetch(
        `${BASE_URL}/api/video/generate-video`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: script }), // Use the edited script
        }
      );

      const videoData = await videoResponse.json();
      if (!videoResponse.ok || !videoData.uuid) {
        throw new Error(videoData.error || "Failed to queue video generation.");
      }

      pollVideoStatus(videoData.uuid);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
      setIsLoading(false);
    }
  };

  const pollVideoStatus = async (uuid) => {
    // Polling logic for checking video status
    try {
      const statusResponse = await fetch(
        `${BASE_URL}/api/video/video-status?uuid=${uuid}`
      );
      const statusData = await statusResponse.json();

      if (statusData.status === "success" && statusData.videoUrl) {
        setVideoUrl(statusData.videoUrl);
        // Use the shortened script for subtitles
        setSubtitlesUrl(generateSubtitlesUrl(shortenedScript)); // Set subtitles URL from the shortened script
        setStatus("Video generated successfully!");
        setVideoGenerated(true); // Mark video as generated
        setIsLoading(false); // Reset loading state
      } else {
        setStatus(statusData.status);
        setTimeout(() => pollVideoStatus(uuid), 600000); // Retry polling every 10 seconds
      }
    } catch (error) {
      console.error("Error polling video status:", error);
      setStatus("Error checking video status.");
      setIsLoading(false); // Reset loading state in case of error
    }
  };

  const generateSubtitlesUrl = (shortenedScript) => {
    // Create a VTT (WebVTT) formatted subtitle file
    const subtitleContent = `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${shortenedScript}\n`;
    const subtitleFile = new Blob([subtitleContent], { type: "text/vtt" });
    const subtitleUrl = URL.createObjectURL(subtitleFile);
    return subtitleUrl;
  };

  const handleDownloadVideo = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "generated-video.mp4"; // Set default file name for download
    a.click();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Generate AI Video 🎥</h1>

      <textarea
        style={styles.textarea}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Enter your video idea... and generate script"
      />

      <button
        style={{
          ...styles.button,
          ...(isLoading && styles.buttonHover), // Apply hover effect while loading
        }}
        onClick={handleGenerateScript}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Script"}
      </button>

      {status && <p style={styles.status}>{status}</p>}
      {isLoading && <p style={styles.status}>Loading...</p>}

      {script && (
        <div>
          <h3>Edit Script</h3>
          <textarea
            style={styles.editTextarea} // Increased width for script editing area
            value={script}
            onChange={(e) => setScript(e.target.value)} // Update the script in state
          />
          <button
            style={styles.button}
            onClick={handleGenerateVideo}
            disabled={isLoading}
          >
            {isLoading ? "Generating Video ...please hold on!" : "Generate Video"}
          </button>
        </div>
      )}

      {videoUrl && (
        <div style={styles.videoContainer}>
          <h2 style={styles.videoTitle}>Generated Video 🎥</h2>
          <video controls style={styles.video}>
            <source src={videoUrl} type="video/mp4" />
            {subtitlesUrl && (
              <track src={subtitlesUrl} kind="subtitles" label="English" default />
            )}
            Your browser does not support the video tag.
          </video>
          {videoGenerated && (
            <div>
              <button
                style={styles.downloadButton}
                onClick={handleDownloadVideo}
              >
                Download Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    backgroundColor: "#f7f7f7",
    boxSizing: "border-box",
    fontFamily: '"Arial", sans-serif',
    minHeight: "100vh", // Allow scrolling
  },
  heading: {
    fontSize: "36px",
    marginBottom: "30px",
    textAlign: "center",
    color: "#4a4a4a",
    fontWeight: "bold",
  },
  textarea: {
    width: "90%",
    maxWidth: "600px",
    height: "150px",
    fontSize: "18px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #ccc",
    resize: "none",
    marginBottom: "30px", // Increased margin to create spacing
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "box-shadow 0.3s ease",
  },
  editTextarea: {
    width: "90%",
    maxWidth: "600px",
    height: "300px",
    fontSize: "18px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #ccc",
    resize: "none",
    marginBottom: "30px", // Increased margin to create spacing
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "box-shadow 0.3s ease",
  },
  button: {
    width: "50%",
    maxWidth: "300px",
    padding: "16px",
    fontSize: "18px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    marginBottom: "30px", // Increased margin to create spacing
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
    transform: "scale(1.05)",
  },
  status: {
    fontSize: "18px",
    textAlign: "center",
    color: "#333",
    fontWeight: "lighter",
    marginBottom: "30px", // Increased margin to create spacing
  },
  videoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: "30px",
  },
  videoTitle: {
    fontSize: "22px",
    marginBottom: "15px",
    color: "#333",
    fontWeight: "bold",
  },
  video: {
    width: "90%",
    maxWidth: "500px",
    height: "auto", // Ensures the video maintains portrait aspect ratio
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  downloadButton: {
    marginTop: "10px",
    padding: "12px 24px",
    fontSize: "18px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
};
