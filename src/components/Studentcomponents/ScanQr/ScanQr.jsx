import React, { useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    return () => {
      stopCameraScan();
      stopFrontCamera();
    };
    // eslint-disable-next-line
  }, []);

  // Play success sound
  const playSuccessSound = () => {
    const audio = new Audio(Sounds.Success);
    audio.play().catch(() => {});
  };

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
        () => reject("Unable to retrieve location. Allow location access.")
      );
    });

  // Modal Helper
  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  // Core logic: Handle QR code found
  const handleQrFound = async (sessionIdFromQr) => {
    const usedSessionId = parseSessionId(sessionIdFromQr);
    if (!studentId)
      return showModal("error", "Student ID not found. Log in again.");
    if (!usedSessionId) return showModal("error", "Invalid QR code.");
    if (!authToken)
      return showModal("error", "Auth token missing. Log in again.");
    setSessionIdForCapture(usedSessionId);
    await openFrontCamera();
  };

  // Camera scan (back camera) for QR
  const startCameraScan = async () => {
    await stopFrontCamera();
    setScanning(true);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length)
        return (
          showModal("error", "No camera found on this device."),
          setScanning(false)
        );
      let cameraId = cameras[0].id;
      const backCamera = cameras.find(
        (cam) => cam.label && /back|environment/i.test(cam.label)
      );
      if (backCamera) cameraId = backCamera.id;
      if (!html5QrCodeRef.current)
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-region");
      else await html5QrCodeRef.current.clear();
      await html5QrCodeRef.current.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleQrFound(decodedText);
        }
      );
    } catch (err) {
      showModal("error", "Unable to access camera: " + (err?.message || err));
      setScanning(false);
    }
  };
  const stopCameraScan = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const isScanning = html5QrCodeRef.current.getState() === 2;
      if (isScanning) await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
    } catch (err) {
    } finally {
      html5QrCodeRef.current = null;
      setScanning(false);
    }
  };

  // Selfie capture (front camera)
  const openFrontCamera = async () => {
    await stopCameraScan();
    setCameraOpen(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showModal(
        "error",
        "Unable to access front camera: " + (err?.message || err)
      );
      setCameraOpen(false);
    }
  };
  const stopFrontCamera = async () => {
    setCameraOpen(false);
    setCapturedImage(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
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

  // Submit attendance with image (camera or upload), using FormData
  const submitWithImage = async () => {
    if (!capturedImage || !capturedImage.startsWith("data:image"))
      return showModal(
        "error",
        "Please capture or upload a valid image before submitting."
      );

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
        response.data?.message || "Attendance marked successfully!"
      );
      playSuccessSound();
      await stopFrontCamera();
    } catch (err) {
      const data = err?.response?.data;
      const serverMsg =
        typeof data === "string"
          ? data
          : data?.error ?? data?.message ?? err?.message ?? "Request failed";
      showModal("error", serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Manual input flow (same as scan)
  const onManualSubmit = async () => {
    if (!code) return showModal("error", "Please enter a QR code.");
    await handleQrFound(code);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-orange-600">
          Scan QR Code
        </h2>
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col items-center">
          {/* QR scanner region */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[70vh] bg-gray-200 flex items-center justify-center rounded-lg mb-4 overflow-hidden">
            <div id="qr-reader-region" className="w-full h-full" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center bg-gray-100/80 z-10 text-sm">
                Camera preview will appear here
              </div>
            )}
          </div>
          {/* Start/Stop QR scanner buttons */}
          <div className="flex gap-2 w-full mt-2">
            {!scanning ? (
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full"
                onClick={startCameraScan}
                disabled={cameraOpen || loading}
              >
                Start Camera Scan
              </button>
            ) : (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition w-full"
                onClick={stopCameraScan}
                disabled={loading}
              >
                Stop Scan
              </button>
            )}
          </div>
          {/* Manual QR entry */}
          <div className="mt-6 w-full">
            <label
              className="block text-gray-700 mb-2 text-sm"
              htmlFor="manual-qr"
            >
              Or enter QR code manually:
            </label>
            <input
              id="manual-qr"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm sm:text-base outline-orange-400"
              placeholder="Enter QR code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={scanning || cameraOpen || loading}
            />
            <button
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onManualSubmit}
              disabled={loading || scanning || cameraOpen}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Selfie/Gallery Modal */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2"
          onClick={(e) => {
            if (e.target === e.currentTarget) stopFrontCamera();
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-xl p-4 flex flex-col items-center">
            {!capturedImage ? (
              <>
                {/* Camera preview */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto rounded-lg object-cover"
                  style={{ maxHeight: "70vh", transform: "scaleX(-1)" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={captureImage}
                  className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full sm:w-1/2"
                  disabled={loading}
                >
                  Capture Image
                </button>
                <div className="my-2 text-gray-500 text-sm">or</div>
                <input
                  type="file"
                  accept="image/*"
                  className="mb-2"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </>
            ) : (
              <div className="w-full relative flex flex-col items-center mt-4">
                <img
                  src={capturedImage}
                  alt="Captured or Uploaded"
                  className="w-full rounded-lg object-cover max-h-[70vh]"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  style={{ zIndex: 10 }}
                  title="Recapture or Re-upload"
                  disabled={loading}
                >
                  ×
                </button>
                <button
                  onClick={submitWithImage}
                  className={`mt-4 px-4 py-2 rounded-lg transition w-full sm:w-1/2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    capturedImage && capturedImage.startsWith("data:image")
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  disabled={
                    !capturedImage ||
                    !capturedImage.startsWith("data:image") ||
                    loading
                  }
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Attendance"
                  )}
                </button>
              </div>
            )}
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