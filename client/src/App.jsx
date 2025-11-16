import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BsUpload } from "react-icons/bs";
import { CiImageOn, CiVideoOn } from "react-icons/ci";
import { DNA } from "react-loader-spinner";
import { motion } from "framer-motion";
import useHover from "./hooks/useHover";

const App = () => {
  const BASEURL = "http://localhost:8000";
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState([]);
  
  const [isHover, hoverRef] = useHover();
  const [isHover2, hoverRef2] = useHover();

  const handleUpload = (e, type) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      type === "video" ? setVideoUrl(reader.result) : setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const predict = async (type) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(type, selectedFile);

      const res = await fetch(`${BASEURL}/predict${type.charAt(0).toUpperCase() + type.slice(1)}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      setLoading(false);
      toast.success("Predicted Successfully");
    } catch (error) {
      toast.error("API Error!");
      setLoading(false);
    }
  };

  const reset = () => {
    setVideoUrl("");
    setImageUrl("");
    setSelectedFile(null);
    setResult("");
    setFrames([]);
  };

  useEffect(() => {
    if (videoUrl) extractFrames();
  }, [videoUrl]);

  const extractFrames = () => {
	const video = document.createElement("video");
	video.src = videoUrl;
	video.crossOrigin = "anonymous";
	video.currentTime = 0;
  
	video.onloadeddata = () => {
	  const canvas = document.createElement("canvas");
	  const ctx = canvas.getContext("2d");
  
	  const captureFrame = (time) => {
		if (time >= video.duration) return;
		
		video.currentTime = time;
		video.onseeked = () => {
		  canvas.width = video.videoWidth;
		  canvas.height = video.videoHeight;
		  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		  
		  setFrames((prevFrames) => [...prevFrames, canvas.toDataURL("image/png")]); // Update instantly
		  captureFrame(time + 1);
		};
	  };
	  captureFrame(0);
	};
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
      <h1 className="text-4xl font-extrabold mb-8 text-center">Deepfake Detection</h1>

      {!videoUrl && !imageUrl && (
        <div className="flex flex-wrap justify-center gap-8">
          {[{ label: "Upload Video", type: "video", ref: hoverRef, hover: isHover, icon: <CiVideoOn size={70} /> },
            { label: "Upload Image", type: "image", ref: hoverRef2, hover: isHover2, icon: <CiImageOn size={70} /> }].map(({ label, type, ref, hover, icon }) => (
            <label key={type} ref={ref} className="flex flex-col items-center justify-center gap-3 w-56 h-56 rounded-xl p-5 border-4 border-white border-dashed bg-white/20 hover:bg-white/40 transition-all cursor-pointer">
              <div className="text-lg font-semibold">{label}</div>
              <motion.div animate={{ scale: hover ? 1.2 : 1 }}>{hover ? <BsUpload size={70} /> : icon}</motion.div>
              <input type="file" accept={`${type}/*`} onChange={(e) => handleUpload(e, type)} className="hidden" />
            </label>
          ))}
        </div>
      )}

      {(videoUrl || imageUrl) && (
        <div className="mt-8 flex flex-col items-center gap-6">
          {videoUrl && <video src={videoUrl} controls className="w-96 rounded-lg shadow-lg" />}
          {imageUrl && <img src={imageUrl} alt="Uploaded" className="w-96 rounded-lg shadow-lg" />}
          {frames.length > 0 && (
		    <div className="max-w-[384px] h-24 overflow-x-auto flex gap-2 border-2 border-white/30 p-2 rounded-lg">
		      {frames.map((frame, index) => (
		        <img key={index} src={frame} alt={`Frame ${index}`} className="w-20 h-16 rounded shadow-md" />
		      ))}
		    </div>
		  )}
          {result && (
            <motion.div className="text-xl font-bold p-3 rounded-xl bg-white/20" animate={{ scale: [0.8, 1] }}>
              Prediction Result: {result.result === 0 ? (
                <span className="text-green-400">Real</span>
              ) : result.result === 1 ? (
                <span className="text-red-400">Fake</span>
              ) : (
                <span className="text-gray-400">No Face Detected</span>
              )}
            </motion.div>
          )}

          <div className="flex gap-4">
		  <motion.button onClick={reset} className="px-6 py-3 border-2 border-dotted border-red-500 text-white hover:bg-red-500/100 transition-all font-semibold rounded-xl"> Try Another </motion.button>         
		  {videoUrl && !result && (
			<motion.button onClick={() => predict("video")} className="px-6 py-3 border-2 border-dotted border-green-500 text-white hover:bg-green-500 transition-all font-semibold rounded-xl"> Predict Video </motion.button>   
          )}
          {imageUrl && !result && (
			<motion.button onClick={() => predict("image")} className="px-6 py-3 border-2 border-dotted border-green-500 text-white hover:bg-green-500 transition-all font-semibold rounded-xl">Predict Image</motion.button>
          )}
          </div>
        </div>
      )}

      {loading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"><DNA visible={true} height="150" width="150" /><p className="text-lg font-semibold mt-4">Processing, please wait...</p></div>}
      <ToastContainer position="top-center" />
    </div>
  );
};

export default App;