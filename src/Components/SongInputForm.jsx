import React, { useState } from "react";

const BASE_URL = "https://beat-sync-backend-1.onrender.com"; 

export default function SongInputForm() {
  const [songName, setSongName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileURL, setFileURL] = useState("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchSongFromAPI = async () => {
    if (!songName) return;
    setIsLoading(true);

    try {
      const clientId = "de0debdc";
      const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=jsonpretty&name=${songName}&limit=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error || data.results.length === 0) {
        throw new Error("Song not found.");
      }

      setFileURL(data.results[0].audio);
      setUploadedFile(null);
    } catch (error) {
      setError(error.message || "Error fetching song.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadedFile(file);
    setFileURL(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!songName && !uploadedFile) {
      setError("Please enter a song name or upload a song file.");
      return;
    }

    const formData = new FormData();
    formData.append("songName", songName);
    if (uploadedFile) formData.append("songFile", uploadedFile);

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/video/generate-video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate video.");
      }

      const data = await response.json();
      setVideoUrl(`${BASE_URL}${data.videoUrl}`); 
      alert("Video generated successfully!");

      setSongName("");
      setUploadedFile(null);
      setFileURL("");
      setError("");
    } catch (error) {
      setError(error.message || "Error generating video.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-2xl w-screen">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Create Your Video</h2>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Song File */}
          <div className="flex flex-col space-y-2">
            <label className="text-lg font-medium">Upload Song File</label>
            <input
              type="file"
              accept=".mp3,.wav"
              onChange={handleFileChange}
              className="w-full p-4 bg-gray-100 text-gray-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Enter Song Name */}
          <div className="flex flex-col space-y-2">
            <label className="text-lg font-medium">Enter Song Name</label>
            <input
              type="text"
              placeholder="Enter song name"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="w-full p-4 bg-gray-100 text-gray-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={fetchSongFromAPI}
              className="w-full py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {isLoading ? "Fetching..." : "Play the song"}
            </button>
          </div>

          {fileURL && (
            <div className="space-y-2">
              <h3 className="text-center text-lg">Now Playing</h3>
              <audio controls className="w-full mt-2 rounded-lg shadow-lg">
                <source src={fileURL} />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 font-semibold rounded-lg shadow-md focus:outline-none ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Generating... hold on! Syncing the beats it may take a while" : "Generate Video with Beat Sync 🥁🎶"}
          </button>
        </form>

        {isLoading && (
          <div className="text-center text-white mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-white mx-auto"></div>
            <p>Generating video...</p>
          </div>
        )}

        {videoUrl && (
          <div className="mt-6 text-center">
            <p className="text-gray-800 text-lg font-medium">Your Video:</p>
            <video controls className="w-full mt-2 rounded-lg shadow-lg">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Download Video Button */}
            <a
              href={videoUrl}
              download
              className="mt-4 inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
