import { useEffect, useState, useMemo } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../Context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/Models/ConfirmModal";
import "react-loading-skeleton/dist/skeleton.css";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { BarChart2, ChartNoAxesCombined, CopyIcon, Filter } from "lucide-react";

const TeacherAttendance = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authToken, CurrentUser } = useAuth();
  const teacherId = CurrentUser?.existuser?._id;

  const [actionLoading, setActionLoading] = useState({
    endId: null,
    deleteId: null,
  });

  const [error, setError] = useState("");

  // Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    type: "danger",
  });

  const endSession = async (sessionId) => {
    try {
      setActionLoading((prev) => ({ ...prev, endId: sessionId }));
      const res = await axiosInstance.post(
        `/session/end`,
        { sessionId },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      toast.success(res.data.message || "Session ended!");
      setStats((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, status: "inactive" } : s,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end session.");
    } finally {
      setActionLoading((prev) => ({ ...prev, endId: null }));
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      setActionLoading((prev) => ({ ...prev, deleteId: sessionId }));
      const res = await axiosInstance.delete(`/session/delete`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { sessionId },
      });
      toast.success(res.data.message || "Session deleted!");
      setStats((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete session.");
    } finally {
      setActionLoading((prev) => ({ ...prev, deleteId: null }));
    }
  };

  // --- confirm handler ---
  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setConfirmOpen(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get(
          `/user/teacher/${teacherId}/attendance-stats`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        setStats(res.data.stats || []);
      } catch {
        setError("Failed to fetch attendance stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [teacherId, authToken]);

  const [filterValue, setFilterValue] = useState("");
  const filteredStats = useMemo(() => {
    if (filterValue === "active")
      return stats.filter((s) => s.status === "active");
    if (filterValue === "inactive")
      return stats.filter((s) => s.status === "inactive");
    if (filterValue === "recent")
      return [...stats].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    return stats;
  }, [stats, filterValue]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy: ", err);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 px-6 overflow-y-auto mb-15 md:mb-0">
          <div className="w-full flex justify-between sticky top-0 z-50 bg-white p-4 md:flex-row flex-col space-y-2">
            <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-x-2">
              <ChartNoAxesCombined size={40} /> Attendance Stats
            </h1>
            <div className="w-full md:w-auto">
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full md:w-auto border border-orange-300 text-gray-700 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white"
              >
                <option value="">All Sessions</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="recent">Recently Created</option>
              </select>
            </div>
          </div>
          {/* Table */}
          {loading ? (
            <SkeletonTheme baseColor="#fed7aa" highlightColor="#ffedd5">
              <div className="overflow-x-auto">
                {/* Skeleton Table for Desktop */}
                <table className="hidden md:table min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
                  <thead className="bg-orange-500 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Session ID</th>
                      <th className="py-3 px-4 text-left">Class Name</th>
                      <th className="py-3 px-4 text-left">Created At</th>
                      <th className="py-3 px-4 text-center">Total Marked</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-neutral-300">
                        <td className="py-3 px-4">
                          <Skeleton width={120} />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton width={140} />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton width={180} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Skeleton width={60} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Skeleton width={70} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Skeleton width={100} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 📱 Skeleton Cards for Mobile */}
                <div className="md:hidden space-y-4 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white shadow rounded-lg p-4 space-y-2"
                    >
                      <Skeleton height={20} width={120} />
                      <Skeleton count={3} />
                      <div className="flex gap-2 mt-2">
                        <Skeleton height={35} width="100%" />
                        <Skeleton height={35} width="100%" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SkeletonTheme>
          ) : error ? (
            <p className="text-red-600 text-center font-semibold">{error}</p>
          ) : stats.length === 0 ? (
            <p className="text-center text-gray-600 py-6 font-medium">
              No attendance data found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Table for md+ screens */}
              <table className="hidden md:table min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-orange-500 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Session ID</th>
                    <th className="py-3 px-4 text-left">Class Name</th>
                    <th className="py-3 px-4 text-left">Created At</th>
                    <th className="py-3 px-4 text-center">Total Marked</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-gray-600 py-6 font-medium"
                      >
                        No {filterValue} session found.
                      </td>
                    </tr>
                  )}
                  {filteredStats.map((stat) => (
                    <tr
                      key={stat.sessionId}
                      className="border-b border-neutral-300 hover:bg-orange-50 transition-colors"
                    >
                      <td
                        className="py-3 px-4 cursor-pointer group"
                        onClick={() => handleCopy(stat.sessionId)}
                        title="Copy Session ID"
                      >
                        <div className="flex items-center gap-2">
                          <span>{stat.sessionId.slice(0, 8)}...</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-neutral-400 hover:text-neutral-600 flex items-center">
                            <CopyIcon size={20} />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{stat.className}</td>
                      <td className="py-3 px-4">
                        {new Date(stat.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stat.totalMarked}
                      </td>
                      <td
                        className={`py-3 px-4 text-center font-bold ${
                          stat.status === "active"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {stat.status}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex justify-center items-center gap-2">
                          {stat.status !== "inactive" && (
                            <button
                              onClick={() => {
                                setConfirmOpen(true);
                                setConfirmConfig({
                                  title: "End Class",
                                  message:
                                    "Are you sure you want to end this session?",
                                  type: "warning",
                                });
                                setConfirmAction(
                                  () => () => endSession(stat.sessionId),
                                );
                              }}
                              className="relative bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded-md font-semibold transition flex justify-center items-center min-w-[100px]"
                              disabled={
                                actionLoading.endId === stat.sessionId ||
                                actionLoading.deleteId === stat.sessionId
                              }
                            >
                              <span
                                className={`transition-opacity ${
                                  actionLoading.endId === stat.sessionId
                                    ? "opacity-0"
                                    : "opacity-100"
                                }`}
                              >
                                End
                              </span>
                              {actionLoading.endId === stat.sessionId && (
                                <div className="absolute w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setConfirmOpen(true);
                              setConfirmConfig({
                                title: "Delete Class",
                                message:
                                  "Are you sure you want to delete this session? This cannot be undone.",
                                type: "danger",
                              });
                              setConfirmAction(
                                () => () => deleteSession(stat.sessionId),
                              );
                            }}
                            className={`relative ${
                              stat.status === "inactive"
                                ? "w-full max-w-[208px]"
                                : "min-w-[100px]"
                            } bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-md font-semibold transition flex justify-center items-center`}
                            disabled={
                              actionLoading.deleteId === stat.sessionId ||
                              actionLoading.endId === stat.sessionId
                            }
                          >
                            <span
                              className={`transition-opacity ${
                                actionLoading.deleteId === stat.sessionId
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                            >
                              Delete
                            </span>
                            {actionLoading.deleteId === stat.sessionId && (
                              <div className="absolute w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* For Small Screen device */}
              <div className="md:hidden space-y-4">
                {filteredStats.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-gray-600 py-12 bg-white rounded-lg shadow">
                    <p className="text-lg font-medium">
                      No {filterValue} session found.
                    </p>
                  </div>
                )}
                {filteredStats.map((stat) => (
                  <div
                    key={stat.sessionId}
                    className="bg-white shadow rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="font-bold text-lg">{stat.className}</h2>
                      <span
                        className={`text-sm font-bold ${
                          stat.status === "active"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {stat.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Created At:</span>{" "}
                      {new Date(stat.createdAt).toLocaleString()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Total Marked:</span>{" "}
                      {stat.totalMarked}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <div className="text-gray-600 text-sm">
                        <div
                          className="flex items-center gap-2 group cursor-pointer w-fit"
                          onClick={() => handleCopy(stat.sessionId)}
                          title="Copy Session ID"
                        >
                          <span className="font-medium">Session id:</span>{" "}
                          {stat.sessionId}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-neutral-400 hover:text-neutral-600 flex items-center">
                            <CopyIcon size={16} />
                          </span>
                        </div>
                      </div>
                    </p>
                    <div className="flex gap-2 mt-2">
                      {stat.status !== "inactive" && (
                        <button
                          onClick={() => {
                            setConfirmOpen(true);
                            setConfirmConfig({
                              title: "End Class",
                              message:
                                "Are you sure you want to end this session?",
                              type: "warning",
                            });
                            setConfirmAction(
                              () => () => endSession(stat.sessionId),
                            );
                          }}
                          disabled={
                            actionLoading.endId === stat.sessionId ||
                            actionLoading.deleteId === stat.sessionId
                          }
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md font-semibold transition flex justify-center items-center gap-3 disabled:opacity-80"
                        >
                          {actionLoading.endId === stat.sessionId ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Ending...
                            </>
                          ) : (
                            "End"
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setConfirmOpen(true);
                          setConfirmConfig({
                            title: "Delete Class",
                            message:
                              "Are you sure you want to delete this session? This cannot be undone.",
                            type: "danger",
                          });
                          setConfirmAction(
                            () => () => deleteSession(stat.sessionId),
                          );
                        }}
                        disabled={
                          actionLoading.deleteId === stat.sessionId ||
                          actionLoading.endId === stat.sessionId
                        }
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-semibold transition flex justify-center items-center gap-3 disabled:opacity-80"
                      >
                        {actionLoading.deleteId === stat.sessionId ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </>
  );
};

export default TeacherAttendance;
