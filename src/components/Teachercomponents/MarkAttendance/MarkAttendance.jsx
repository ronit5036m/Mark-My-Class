import { useState } from "react";
import toast from "react-hot-toast";
import { Highlighter, CheckCircle2 } from "lucide-react";
import Sidebar from "../../Sidebar/Sidebar";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../Context/AuthContext";

const MarkAttendance = () => {
  const { authToken, CurrentUser } = useAuth();
  const teacherId = CurrentUser?.existuser?._id;

  const [formData, setFormData] = useState({
    studentEmail: "",
    sessionId: "",
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      teacherId,
      studentEmail: formData.studentEmail,
      sessionId: formData.sessionId,
    };

    try {
      const res = await axiosInstance.post("/attendance/teacher/mark", body, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast.success("Attendance marked successfully!");
      setSuccessData(res?.data);
      setFormData({ studentEmail: "", sessionId: "" });
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("Attendance already marked for this student");
      } else if (error.response?.status === 403) {
        toast.error("Invalid teacher");
      } else if (error.response?.status === 404) {
        toast.error("Session not found");
      } else {
        toast.error("Student not found");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar />
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <h1 className="flex items-center text-3xl font-bold text-orange-600 text-left mb-8 gap-3">
          <Highlighter size={30} /> Mark Attendance
        </h1>

        <div className="flex justify-center items-center min-h-[60vh]">
          {/* Removed the redundant outer wrapper and combined styles onto the form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg border border-orange-200 rounded-2xl p-8 space-y-6 w-full max-w-xl"
          >
            {/* Student Email */}
            <div>
              <label className="block text-sm font-semibold text-orange-600 mb-1">
                Student Email
              </label>
              <input
                type="email"
                name="studentEmail"
                value={formData.studentEmail}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Enter student email"
                className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 transition-shadow"
              />
            </div>

            {/* Session ID */}
            <div>
              <label className="block text-sm font-semibold text-orange-600 mb-1">
                Session ID
              </label>
              <input
                type="text"
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Enter session ID"
                className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 transition-shadow"
              />
            </div>

            {/* Mark Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 transition text-white font-semibold px-6 py-3 rounded-lg w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Marking Attendance...
                </>
              ) : (
                "Mark Attendance"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal - Changed absolute to fixed for better scrolling behavior */}
      {successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full animate-in fade-in zoom-in duration-200">
            <CheckCircle2 className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Attendance Marked Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Attendance has been marked successfully for{" "}
              <b className="text-gray-800">{successData.student}</b>
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-left mb-6 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="font-semibold text-gray-500">Student:</span>
                <span className="text-gray-800 font-medium">
                  {successData.student}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-500">Email:</span>
                <span className="text-gray-800 font-medium">
                  {formData.studentEmail}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-500">Session ID:</span>
                <span className="text-gray-800 font-medium">
                  {successData.sessionId}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-500">Teacher:</span>
                <span className="text-gray-800 font-medium">
                  {successData.teacher}
                </span>
              </p>
              <p className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-500">Time:</span>
                <span className="text-gray-800 font-medium">
                  {new Date(successData.time).toLocaleString()}
                </span>
              </p>
            </div>

            <button
              onClick={() => setSuccessData(null)}
              className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
