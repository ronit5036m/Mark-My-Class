// import React, { useState, useRef, useEffect } from "react";
// import Sidebar from "../../Sidebar/Sidebar";
// import { Html5Qrcode } from "html5-qrcode";
// import { useAuth } from "../../../Context/AuthContext";
// import axiosInstance from "../../../api/axiosInstance";
// import Sounds from "../../../assets/Sounds";
// import NotificationModal from "../../../components/Models/NotificationModal";

// // Utility: Parse sessionId from QR
// function parseSessionId(raw) {
//   if (!raw) return "";
//   try {
//     const asJson = JSON.parse(raw);
//     const candidates = [asJson.sessionId, asJson.sessionID, asJson.id];
//     for (const candidate of candidates) {
//       if (typeof candidate === "string" && candidate.trim())
//         return candidate.trim();
//     }
//   } catch (_) {}
//   const text = String(raw).trim();
//   try {
//     const url = new URL(text);
//     const fromQuery =
//       url.searchParams.get("sessionId") ||
//       url.searchParams.get("sessionID") ||
//       url.searchParams.get("id");
//     if (fromQuery && fromQuery.trim()) return fromQuery.trim();
//     const parts = url.pathname.split("/").filter(Boolean);
//     if (parts.length > 0) {
//       const last = parts[parts.length - 1];
//       if (last && last.trim()) return last.trim();
//     }
//   } catch (_) {}
//   const objectIdMatch = text.match(/[a-f0-9]{24}/i);
//   if (objectIdMatch) return objectIdMatch[0];
//   return text;
// }

// // Convert base64 dataURL to Blob
// function dataURLtoBlob(dataurl) {
//   const arr = dataurl.split(",");
//   const mime = arr[0].match(/:(.*?);/)[1];
//   const bstr = atob(arr[1]);
//   let n = bstr.length;
//   const u8arr = new Uint8Array(n);
//   while (n--) {
//     u8arr[n] = bstr.charCodeAt(n);
//   }
//   return new Blob([u8arr], { type: mime });
// }

// const ScanQr = () => {
//   // State
//   const [code, setCode] = useState("");
//   const [scanning, setScanning] = useState(false);
//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [sessionIdForCapture, setSessionIdForCapture] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Refs
//   const html5QrCodeRef = useRef(null);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   // Auth/User
//   const { CurrentUser, authToken } = useAuth();
//   const studentId =
//     CurrentUser?.existuser?._id ||
//     CurrentUser?.studentId ||
//     CurrentUser?._id ||
//     "";

//   // Notification Modal
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState("info");
//   const [modalMessage, setModalMessage] = useState("");

//   useEffect(() => {
//     return () => {
//       stopCameraScan();
//       stopFrontCamera();
//     };
//     // eslint-disable-next-line
//   }, []);

//   // Play success sound
//   const playSuccessSound = () => {
//     const audio = new Audio(Sounds.Success);
//     audio.play().catch(() => {});
//   };

//   // Location
//   const getLocation = () =>
//     new Promise((resolve, reject) => {
//       if (!("geolocation" in navigator))
//         return reject("Geolocation not supported.");
//       navigator.geolocation.getCurrentPosition(
//         (pos) =>
//           resolve({
//             latitude: pos.coords.latitude,
//             longitude: pos.coords.longitude,
//           }),
//         () => reject("Unable to retrieve location. Allow location access.")
//       );
//     });

//   // Modal Helper
//   const showModal = (type, message) => {
//     setModalType(type);
//     setModalMessage(message);
//     setModalOpen(true);
//   };

//   // Core logic: Handle QR code found
//   const handleQrFound = async (sessionIdFromQr) => {
//     const usedSessionId = parseSessionId(sessionIdFromQr);
//     if (!studentId)
//       return showModal("error", "Student ID not found. Log in again.");
//     if (!usedSessionId) return showModal("error", "Invalid QR code.");
//     if (!authToken)
//       return showModal("error", "Auth token missing. Log in again.");
//     setSessionIdForCapture(usedSessionId);
//     await openFrontCamera();
//   };

//   // Camera scan (back camera) for QR
//   const startCameraScan = async () => {
//     await stopFrontCamera();
//     setScanning(true);
//     try {
//       const cameras = await Html5Qrcode.getCameras();
//       if (!cameras?.length)
//         return (
//           showModal("error", "No camera found on this device."),
//           setScanning(false)
//         );
//       let cameraId = cameras[0].id;
//       const backCamera = cameras.find(
//         (cam) => cam.label && /back|environment/i.test(cam.label)
//       );
//       if (backCamera) cameraId = backCamera.id;
//       if (!html5QrCodeRef.current)
//         html5QrCodeRef.current = new Html5Qrcode("qr-reader-region");
//       else await html5QrCodeRef.current.clear();
//       await html5QrCodeRef.current.start(
//         { deviceId: { exact: cameraId } },
//         { fps: 10, qrbox: { width: 250, height: 250 } },
//         async (decodedText) => {
//           await handleQrFound(decodedText);
//         }
//       );
//     } catch (err) {
//       showModal("error", "Unable to access camera: " + (err?.message || err));
//       setScanning(false);
//     }
//   };
//   const stopCameraScan = async () => {
//     if (!html5QrCodeRef.current) return;
//     try {
//       const isScanning = html5QrCodeRef.current.getState() === 2;
//       if (isScanning) await html5QrCodeRef.current.stop();
//       await html5QrCodeRef.current.clear();
//     } catch (err) {
//     } finally {
//       html5QrCodeRef.current = null;
//       setScanning(false);
//     }
//   };

//   // Selfie capture (front camera)
//   const openFrontCamera = async () => {
//     await stopCameraScan();
//     setCameraOpen(true);
//     setCapturedImage(null);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user" },
//       });
//       if (videoRef.current) videoRef.current.srcObject = stream;
//     } catch (err) {
//       showModal(
//         "error",
//         "Unable to access front camera: " + (err?.message || err)
//       );
//       setCameraOpen(false);
//     }
//   };
//   const stopFrontCamera = async () => {
//     setCameraOpen(false);
//     setCapturedImage(null);
//     if (videoRef.current && videoRef.current.srcObject) {
//       const tracks = videoRef.current.srcObject.getTracks();
//       tracks.forEach((track) => track.stop());
//       videoRef.current.srcObject = null;
//     }
//   };
//   const restartFrontCamera = async () => {
//     await stopFrontCamera();
//     await openFrontCamera();
//   };

//   // Capture image from front camera
//   const captureImage = () => {
//     if (!videoRef.current || !canvasRef.current) return;
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.translate(canvas.width, 0);
//     ctx.scale(-1, 1);
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//     ctx.setTransform(1, 0, 0, 1, 0, 0);
//     const imgData = canvas.toDataURL("image/jpeg");
//     setCapturedImage(imgData);
//   };

//   // Handle file upload from gallery
//   const handleFileUpload = (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (ev) => {
//         setCapturedImage(ev.target.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Clear image for recapture/upload again
//   const clearImage = async () => {
//     setCapturedImage(null);
//     await restartFrontCamera();
//   };

//   // Submit attendance with image (camera or upload), using FormData
//   const submitWithImage = async () => {
//     if (!capturedImage || !capturedImage.startsWith("data:image"))
//       return showModal(
//         "error",
//         "Please capture or upload a valid image before submitting."
//       );

//     setLoading(true);

//     let currentLocation;
//     try {
//       currentLocation = await getLocation();
//     } catch (errMsg) {
//       setLoading(false);
//       return showModal("error", errMsg);
//     }

//     try {
//       const formData = new FormData();
//       formData.append("studentId", studentId);
//       formData.append("sessionId", sessionIdForCapture);
//       formData.append("lat", currentLocation.latitude);
//       formData.append("lng", currentLocation.longitude);
//       formData.append("liveImage", dataURLtoBlob(capturedImage), "selfie.jpg");

//       const response = await axiosInstance.post("/attendance/mark", formData, {
//         headers: {
//           Authorization: `Bearer ${authToken}`,
//         },
//       });

//       showModal(
//         "success",
//         response.data?.message || "Attendance marked successfully!"
//       );
//       playSuccessSound();
//       await stopFrontCamera();
//     } catch (err) {
//       const data = err?.response?.data;
//       const serverMsg =
//         typeof data === "string"
//           ? data
//           : data?.error ?? data?.message ?? err?.message ?? "Request failed";
//       showModal("error", serverMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Manual input flow (same as scan)
//   const onManualSubmit = async () => {
//     if (!code) return showModal("error", "Please enter a QR code.");
//     await handleQrFound(code);
//   };

//   return (
//     <div className="flex h-screen w-full bg-gray-50">
//       <Sidebar />
//       <div className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
//         <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-orange-600">
//           Scan QR Code
//         </h2>
//         <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col items-center">
//           {/* QR scanner region */}
//           <div className="relative w-full h-[300px] sm:h-[400px] md:h-[70vh] bg-gray-200 flex items-center justify-center rounded-lg mb-4 overflow-hidden">
//             <div id="qr-reader-region" className="w-full h-full" />
//             {!scanning && (
//               <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center bg-gray-100/80 z-10 text-sm">
//                 Camera preview will appear here
//               </div>
//             )}
//           </div>
//           {/* Start/Stop QR scanner buttons */}
//           <div className="flex gap-2 w-full mt-2">
//             {!scanning ? (
//               <button
//                 className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full"
//                 onClick={startCameraScan}
//                 disabled={cameraOpen || loading}
//               >
//                 Start Camera Scan
//               </button>
//             ) : (
//               <button
//                 className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition w-full"
//                 onClick={stopCameraScan}
//                 disabled={loading}
//               >
//                 Stop Scan
//               </button>
//             )}
//           </div>
//           {/* Manual QR entry */}
//           <div className="mt-6 w-full">
//             <label
//               className="block text-gray-700 mb-2 text-sm"
//               htmlFor="manual-qr"
//             >
//               Or enter QR code manually:
//             </label>
//             <input
//               id="manual-qr"
//               type="text"
//               className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm sm:text-base outline-orange-400"
//               placeholder="Enter QR code"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               disabled={scanning || cameraOpen || loading}
//             />
//             <button
//               className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//               onClick={onManualSubmit}
//               disabled={loading || scanning || cameraOpen}
//             >
//               {loading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Processing...
//                 </>
//               ) : (
//                 "Submit"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Selfie/Gallery Modal */}
//       {cameraOpen && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2"
//           onClick={(e) => {
//             if (e.target === e.currentTarget) stopFrontCamera();
//           }}
//         >
//           <div className="relative w-full max-w-lg bg-white rounded-xl p-4 flex flex-col items-center">
//             {!capturedImage ? (
//               <>
//                 {/* Camera preview */}
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   playsInline
//                   className="w-full h-auto rounded-lg object-cover"
//                   style={{ maxHeight: "70vh", transform: "scaleX(-1)" }}
//                 />
//                 <canvas ref={canvasRef} className="hidden" />
//                 <button
//                   onClick={captureImage}
//                   className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full sm:w-1/2"
//                   disabled={loading}
//                 >
//                   Capture Image
//                 </button>
//                 <div className="my-2 text-gray-500 text-sm">or</div>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   className="mb-2"
//                   onChange={handleFileUpload}
//                   disabled={loading}
//                 />
//               </>
//             ) : (
//               <div className="w-full relative flex flex-col items-center mt-4">
//                 <img
//                   src={capturedImage}
//                   alt="Captured or Uploaded"
//                   className="w-full rounded-lg object-cover max-h-[70vh]"
//                 />
//                 <button
//                   onClick={clearImage}
//                   className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
//                   style={{ zIndex: 10 }}
//                   title="Recapture or Re-upload"
//                   disabled={loading}
//                 >
//                   ×
//                 </button>
//                 <button
//                   onClick={submitWithImage}
//                   className={`mt-4 px-4 py-2 rounded-lg transition w-full sm:w-1/2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
//                     capturedImage && capturedImage.startsWith("data:image")
//                       ? "bg-green-500 text-white hover:bg-green-600"
//                       : "bg-gray-400 text-gray-200 cursor-not-allowed"
//                   }`}
//                   disabled={
//                     !capturedImage ||
//                     !capturedImage.startsWith("data:image") ||
//                     loading
//                   }
//                 >
//                   {loading ? (
//                     <>
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Submitting...
//                     </>
//                   ) : (
//                     "Submit Attendance"
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Notifications */}
//       <NotificationModal
//         open={modalOpen}
//         type={modalType}
//         message={modalMessage}
//         onClose={() => setModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default ScanQr;

import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../../Context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import Sounds from "../../../assets/Sounds";
import NotificationModal from "../../../components/Models/NotificationModal";

// Utility: Parse sessionId from QR
function parseSessionId(raw) {
  if (!raw) return "";
  try {
    const asJson = JSON.parse(raw);
    const candidates = [asJson.sessionId, asJson.sessionID, asJson.id];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim())
        return candidate.trim();
    }
  } catch (_) {}
  const text = String(raw).trim();
  try {
    const url = new URL(text);
    const fromQuery =
      url.searchParams.get("sessionId") ||
      url.searchParams.get("sessionID") ||
      url.searchParams.get("id");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (last && last.trim()) return last.trim();
    }
  } catch (_) {}
  const objectIdMatch = text.match(/[a-f0-9]{24}/i);
  if (objectIdMatch) return objectIdMatch[0];
  return text;
}

// Convert base64 dataURL to Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const ScanQr = () => {
  // State
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [sessionIdForCapture, setSessionIdForCapture] = useState("");
  const [loading, setLoading] = useState(false);

  // Refs
  const html5QrCodeRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Auth/User
  const { CurrentUser, authToken } = useAuth();
  const studentId =
    CurrentUser?.existuser?._id ||
    CurrentUser?.studentId ||
    CurrentUser?._id ||
    "";

  // Notification Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalMessage, setModalMessage] = useState("");

  // Play success sound
  const playSuccessSound = useCallback(() => {
    const audio = new Audio(Sounds.Success);
    audio.play().catch(() => {});
  }, []);

  // Location
  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!("geolocation" in navigator))
        return reject("Geolocation not supported.");
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () =>
          reject("Unable to retrieve location. Please allow location access."),
      );
    });

  // Modal Helper
  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  // Safe camera stop functions
  const stopCameraScan = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const state = html5QrCodeRef.current.getState();
      if (state === 2) {
        // 2 = SCANNING
        await html5QrCodeRef.current.stop();
      }
      await html5QrCodeRef.current.clear();
    } catch (err) {
      console.warn("QR Scanner stop error:", err);
    } finally {
      html5QrCodeRef.current = null;
      setScanning(false);
    }
  };

  const stopFrontCamera = async () => {
    setCameraOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraScan();
      stopFrontCamera();
    };
    // eslint-disable-next-line
  }, []);

  // Core logic: Handle QR code found
  const handleQrFound = async (sessionIdFromQr) => {
    const usedSessionId = parseSessionId(sessionIdFromQr);
    if (!studentId)
      return showModal("error", "Student ID not found. Please log in again.");
    if (!usedSessionId) return showModal("error", "Invalid QR code detected.");
    if (!authToken)
      return showModal("error", "Auth token missing. Please log in again.");

    setSessionIdForCapture(usedSessionId);
    await openFrontCamera();
  };

  // Camera scan (back camera) for QR
  const startCameraScan = async () => {
    await stopFrontCamera();
    setScanning(true);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) {
        showModal("error", "No camera found on this device.");
        setScanning(false);
        return;
      }

      let cameraId = cameras[0].id;
      const backCamera = cameras.find(
        (cam) => cam.label && /back|environment/i.test(cam.label),
      );
      if (backCamera) cameraId = backCamera.id;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-region");
      }

      await html5QrCodeRef.current.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleQrFound(decodedText);
        },
      );
    } catch (err) {
      showModal("error", "Unable to access camera: " + (err?.message || err));
      setScanning(false);
    }
  };

  // Selfie capture (front camera)
  const openFrontCamera = async () => {
    await stopCameraScan();
    setCapturedImage(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showModal(
        "error",
        "Unable to access front camera: " + (err?.message || err),
      );
      setCameraOpen(false);
    }
  };

  const restartFrontCamera = async () => {
    await stopFrontCamera();
    await openFrontCamera();
  };

  // Capture image from front camera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror the image for selfies
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const imgData = canvas.toDataURL("image/jpeg");
    setCapturedImage(imgData);
  };

  // Handle file upload from gallery
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image for recapture/upload again
  const clearImage = async () => {
    setCapturedImage(null);
    await restartFrontCamera();
  };

  // Submit attendance
  const submitWithImage = async () => {
    if (!capturedImage || !capturedImage.startsWith("data:image")) {
      return showModal(
        "error",
        "Please capture or upload a valid image before submitting.",
      );
    }

    setLoading(true);

    let currentLocation;
    try {
      currentLocation = await getLocation();
    } catch (errMsg) {
      setLoading(false);
      return showModal("error", errMsg);
    }

    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("sessionId", sessionIdForCapture);
      formData.append("lat", currentLocation.latitude);
      formData.append("lng", currentLocation.longitude);
      formData.append("liveImage", dataURLtoBlob(capturedImage), "selfie.jpg");

      const response = await axiosInstance.post("/attendance/mark", formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      showModal(
        "success",
        response.data?.message || "Attendance marked successfully!",
      );
      playSuccessSound();
      await stopFrontCamera();
      setCapturedImage(null);
    } catch (err) {
      const data = err?.response?.data;
      const serverMsg =
        typeof data === "string"
          ? data
          : (data?.error ?? data?.message ?? err?.message ?? "Request failed");
      showModal("error", serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const onManualSubmit = async () => {
    if (!code) return showModal("error", "Please enter a QR code.");
    await handleQrFound(code);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Class Attendance
          </h2>
          <p className="text-slate-500 mt-2">
            Scan the QR code provided by your instructor
          </p>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 p-4 sm:p-8 flex flex-col items-center transition-all">
          {/* QR Scanner Region */}
          <div className="relative w-full h-[300px] sm:h-[400px] bg-slate-100 rounded-xl mb-6 overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
            <div
              id="qr-reader-region"
              className="w-full h-full [&>video]:object-cover"
            />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/90 z-10">
                <svg
                  className="w-16 h-16 mb-4 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Camera preview will appear here
                </span>
              </div>
            )}
          </div>

          {/* Start/Stop Controls */}
          <div className="w-full mb-8">
            {!scanning ? (
              <button
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70"
                onClick={startCameraScan}
                disabled={cameraOpen || loading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Start Camera Scan
              </button>
            ) : (
              <button
                className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-slate-700 transition-all disabled:opacity-70"
                onClick={stopCameraScan}
                disabled={loading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Stop Scan
              </button>
            )}
          </div>

          {/* Manual Divider */}
          <div className="w-full flex items-center justify-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-slate-400 text-sm font-medium">
              OR MANUAL ENTRY
            </span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Manual QR entry */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <input
              id="manual-qr"
              type="text"
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="Paste QR Session ID"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={scanning || cameraOpen || loading}
            />
            <button
              className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-900 transition-all flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onManualSubmit}
              disabled={loading || scanning || cameraOpen || !code.trim()}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Selfie/Gallery Modal Overlay */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopFrontCamera();
            }
          }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                Verify Identity
              </h3>
              <button
                onClick={stopFrontCamera}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                disabled={loading}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              {!capturedImage ? (
                <>
                  <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 aspect-[3/4] sm:aspect-video mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  <button
                    onClick={captureImage}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-orange-600 transition-all mb-4 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Take Selfie
                  </button>

                  <div className="relative w-full flex items-center justify-center mb-4">
                    <div className="border-t border-slate-200 absolute w-full"></div>
                    <span className="bg-white px-3 text-xs text-slate-400 relative z-10 font-medium">
                      OR UPLOAD
                    </span>
                  </div>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold cursor-pointer hover:bg-slate-200 transition-all border border-slate-200">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Choose from Gallery
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                  </label>
                </>
              ) : (
                <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative w-full rounded-xl overflow-hidden shadow-md mb-6">
                    <img
                      src={capturedImage}
                      alt="Captured Identity"
                      className="w-full h-auto object-cover max-h-[50vh]"
                    />
                    {!loading && (
                      <button
                        onClick={clearImage}
                        className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur text-white rounded-full p-2 hover:bg-red-500 transition-colors shadow-lg"
                        title="Retake photo"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={submitWithImage}
                    className="w-full bg-green-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-600 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying & Submitting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Confirm Attendance
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationModal
        open={modalOpen}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ScanQr;