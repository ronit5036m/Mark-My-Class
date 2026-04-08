import { useState, useEffect, useRef } from "react";
import "../CSS/CreateQr.css";
import Sidebar from "../../Sidebar/Sidebar";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../Context/AuthContext";

import { Check, ClipboardCopy, QrCode, Share2, X } from "lucide-react";
import toast from "react-hot-toast";

const CreateQr = () => {
  const [department, setDepartment] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [className, setClassName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [wifiCheckEnabled, setWifiCheckEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [locationLocked, setLocationLocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [copying, setCopying] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    end: false,
    delete: false,
  });
  const [actionMessage, setActionMessage] = useState({
    end: "",
    delete: "",
  });

  const { authToken, CurrentUser } = useAuth();
  const qrRef = useRef(null);
  const teacherId = CurrentUser?.existuser?._id;

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (!teacherId) return;
        const res = await axiosInstance.get(
          `/user/teacher/${teacherId}/subjects`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );
        setSubjects(res.data.subjects || []);

        if (res.data.subjects && res.data.subjects.length > 0) {
          setSubjectId(res.data.subjects[0]._id);
          setDepartment(res.data.subjects[0].department || "");
        } else {
          setError(
            "No subjects assigned. Please contact admin or add subjects for this teacher.",
          );
        }
      } catch (err) {
        setError("Failed to fetch subjects. Please try again.");
      }
    };
    fetchSubjects();
  }, [teacherId, authToken]);

  // Update Input field selected subject's
  useEffect(() => {
    if (subjectId) {
      const selectedSubject = subjects.find((s) => s._id === subjectId);
      if (selectedSubject) {
        setDepartment(selectedSubject.department || "");
        setClassName(selectedSubject.subjectName || ""); // auto-fill class name
      }
    }
  }, [subjectId, subjects]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLocationLocked(true);
        },
        () => {
          setError("Failed to get location.");
        },
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQrImage("");
    setSession(null);
    setModalVisible(false);

    try {
      const res = await axiosInstance.post(
        `/session/create`,
        {
          className,
          subjectId,
          lat,
          lng,
          wifiCheckEnabled,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setQrImage(res.data.qrImage);
      setSession(res.data.session);
      setModalVisible(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create session. Make sure all fields are correct.",
      );
    } finally {
      setLoading(false);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!session?.sessionId) return;
    setActionLoading((prev) => ({ ...prev, end: true }));
    setActionMessage((prev) => ({ ...prev, end: "" }));

    try {
      const res = await axiosInstance.post(
        `/session/end`,
        { sessionId: session.sessionId },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setActionMessage((prev) => ({
        ...prev,
        end: res.data.message || "Session ended successfully",
      }));
      setTimeout(() => {
        setModalVisible(false);
        setQrImage("");
        setSession(null);
      }, 500);
    } catch (err) {
      setActionMessage((prev) => ({
        ...prev,
        end: err.response?.data?.message || "Failed to end session",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, end: false }));
    }
  };

  // Delete session
  const handleDeleteSession = async () => {
    if (!session?.sessionId) return;
    setActionLoading((prev) => ({ ...prev, delete: true }));
    setActionMessage((prev) => ({ ...prev, delete: "" }));

    try {
      const res = await axiosInstance.delete(`/session/delete`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { sessionId: session.sessionId },
      });
      setActionMessage((prev) => ({
        ...prev,
        delete: res.data.message || "Session deleted successfully",
      }));
      setTimeout(() => {
        setModalVisible(false);
        setQrImage("");
        setSession(null);
      }, 500);
    } catch (err) {
      setActionMessage((prev) => ({
        ...prev,
        delete: err.response?.data?.message || "Failed to delete session",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  // Share QR
  const shareQrCode = async () => {
    if (!qrImage) return;

    try {
      const fetchResponse = await fetch(qrImage);
      const blob = await fetchResponse.blob();

      const file = new File([blob], "session-qr.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "Session QR Code",
          text: "Scan this QR code to join the session",
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "session-qr.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
    }
  };

  const handleCopySession = async () => {
    if (!session?.sessionId) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(session?.sessionId);
      toast.success("Session copied to clipboard!");
    } catch (_) {
      toast.error("Failed to copy Session");
    } finally {
      setCopying(false);
    }
  };

  const subjectSelectDisabled = subjects.length === 0;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Centered */}
      <div className="flex-1 p-6 overflow-y-auto mb-15 md:mb-0 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-orange-600 mb-6 flex items-center gap-x-2">
            <QrCode size={35} /> Create Session QR Code
          </h1>

          {/* Form Card */}
          <div className="bg-white border border-orange-200 p-6 rounded-2xl shadow-lg w-full">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Class Name (readonly) */}
              <div>
                <label className="block text-orange-500 font-medium mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={className}
                  readOnly
                  placeholder="Class name will auto-fill from selected subject"
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 bg-orange-50 text-gray-600 cursor-auto outline-none"
                />
              </div>

              {/* Department (readonly) */}
              <div>
                <label className="block text-orange-500 font-medium mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  placeholder="Department will be auto-filled"
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 bg-orange-50 text-gray-600 cursor-auto outline-none"
                />
              </div>

              {/* Subject Select */}
              <div>
                <label className="block text-orange-500 font-medium mb-1">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  disabled={subjectSelectDisabled || loading}
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-orange-50"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subj) => (
                    <option key={subj._id} value={subj._id}>
                      {subj.subjectName}
                    </option>
                  ))}
                </select>
                {subjectSelectDisabled && (
                  <p className="text-red-500 text-sm mt-1">
                    No subjects available. Please ask the admin to assign
                    subjects.
                  </p>
                )}
              </div>

              {/* Location Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-orange-500 font-medium mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={lat}
                    required
                    onChange={(e) => !locationLocked && setLat(e.target.value)}
                    placeholder="Mandatory"
                    readOnly={locationLocked}
                    className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-orange-500 font-medium mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={lng}
                    required
                    onChange={(e) => !locationLocked && setLng(e.target.value)}
                    placeholder="Mandatory"
                    readOnly={locationLocked}
                    className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Get Location Button */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLocked}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  locationLocked
                    ? "bg-orange-500/95 text-white cursor-default"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {locationLocked ? "Location Locked" : "Get Current Location"}
              </button>

              {/* WiFi Check */}
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() =>
                  !loading && setWifiCheckEnabled(!wifiCheckEnabled)
                }
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center rounded border transition-colors
          ${
            wifiCheckEnabled
              ? "bg-orange-500 border-orange-500 text-white"
              : "border-gray-400 text-transparent"
          }`}
                >
                  {wifiCheckEnabled && <Check size={16} />}
                </div>
                <span
                  className={`${
                    wifiCheckEnabled ? "text-orange-500" : "text-gray-500"
                  }`}
                >
                  Enable WiFi Check
                </span>
              </div>

              {/* Generate Button */}
              <button
                className="bg-orange-500 font-semibold text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Generate QR Code"
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
          </div>
        </div>

        {/* QR Modal */}
        {modalVisible && qrImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg relative border-t-4 border-orange-500">
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 text-2xl font-bold text-gray-600 hover:text-orange-600"
                onClick={() => setModalVisible(false)}
              >
                <X />
              </button>

              <h3 className="text-xl font-semibold mb-4 text-orange-600">
                Session QR Code
              </h3>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <img
                  ref={qrRef}
                  src={qrImage}
                  alt="QR Code"
                  className="w-48 h-48 border border-orange-300 rounded-lg shadow-md"
                />

                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={shareQrCode}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share QR</span>
                  </button>
                  <button
                    onClick={handleCopySession}
                    title="Copy QR Session"
                    className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Session Details */}
              {session && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2 text-gray-800">
                    Session Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Session ID:
                      </span>{" "}
                      {/* {session.sessionId} */}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Class:</span>{" "}
                      {className}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Department:
                      </span>{" "}
                      {department}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>{" "}
                      <span className="text-green-600">Active</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        WiFi Check:
                      </span>{" "}
                      {wifiCheckEnabled ? "Enabled" : "Disabled"}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Location:
                      </span>{" "}
                      {lat}, {lng}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Created:
                      </span>{" "}
                      {new Date().toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={handleEndSession}
                      disabled={actionLoading.end || actionLoading.delete}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600/80 transition disabled:opacity-80 flex justify-between items-center gap-2"
                    >
                      {actionLoading.end ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Ending...
                        </>
                      ) : (
                        "End Session"
                      )}
                    </button>
                    <button
                      onClick={handleDeleteSession}
                      disabled={actionLoading.delete || actionLoading.end}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition disabled:opacity-70 flex justify-between items-center gap-2"
                    >
                      {actionLoading.delete ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Session"
                      )}
                    </button>
                  </div>

                  {actionMessage.end && (
                    <p className="text-green-600 mt-2">{actionMessage.end}</p>
                  )}
                  {actionMessage.delete && (
                    <p className="text-red-600 mt-2">{actionMessage.delete}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQr;
