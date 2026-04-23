"use client";

import { useState, useEffect } from "react";
import { UserService } from "../services/user.service";
import { User } from "../models/user.model";

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsDialogOpen, setIsPostsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (error) {
      setToastMsg({ type: "error", msg: "Không thể tải danh sách người dùng" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      await UserService.deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
      setToastMsg({ type: "success", msg: "Xóa người dùng thành công" });
    } catch (error) {
      setToastMsg({ type: "error", msg: "Không thể xóa người dùng" });
    }
  };

  const handleViewPosts = async (user: User) => {
    if (!user.id) return;

    try {
      setSelectedUser(user);
      const posts = await UserService.getMyPosts(1, 10, user.id);
      setUserPosts(posts.data);
      setIsPostsDialogOpen(true);
    } catch (error) {
      setToastMsg({
        type: "error",
        msg: "Không thể tải bài viết của người dùng",
      });
    }
  };

  const closeDialog = () => {
    setIsPostsDialogOpen(false);
    setIsTransferDialogOpen(false);
    setSelectedUser(null);
    setUserPosts([]);
    setSelectedPosts([]);
    setTargetUserId("");
  };

  const handleOpenTransferDialog = (user: User) => {
    setSelectedUser(user);
    setIsTransferDialogOpen(true);
    // Reset selected posts when opening transfer dialog
    handleViewPosts(user);
  };

  const handleTogglePostSelection = (postId: string) => {
    setSelectedPosts((prevSelected) =>
      prevSelected.includes(postId)
        ? prevSelected.filter((id) => id !== postId)
        : [...prevSelected, postId]
    );
  };

  const handleTransferAllPosts = async () => {
    if (!selectedUser?.id || !targetUserId) {
      setToastMsg({ type: "error", msg: "Vui lòng chọn người dùng đích" });
      return;
    }

    if (selectedUser.id === targetUserId) {
      setToastMsg({
        type: "error",
        msg: "Không thể chuyển bài viết cho cùng một người dùng",
      });
      return;
    }

    try {
      await UserService.transferAllPosts(selectedUser.id, targetUserId);
      setToastMsg({
        type: "success",
        msg: "Chuyển tất cả bài viết thành công",
      });
      closeDialog();
    } catch (error) {
      setToastMsg({ type: "error", msg: "Không thể chuyển bài viết" });
    }
  };

  const handleTransferSelectedPosts = async () => {
    if (!selectedUser?.id || !targetUserId || selectedPosts.length === 0) {
      setToastMsg({
        type: "error",
        msg:
          selectedPosts.length === 0
            ? "Vui lòng chọn ít nhất một bài viết"
            : "Vui lòng chọn người dùng đích",
      });
      return;
    }

    if (selectedUser.id === targetUserId) {
      setToastMsg({
        type: "error",
        msg: "Không thể chuyển bài viết cho cùng một người dùng",
      });
      return;
    }

    try {
      await UserService.transferSelectedPosts(
        selectedUser.id,
        targetUserId,
        selectedPosts
      );
      setToastMsg({
        type: "success",
        msg: "Chuyển bài viết đã chọn thành công",
      });
      closeDialog();
    } catch (error) {
      setToastMsg({ type: "error", msg: "Không thể chuyển bài viết" });
    }
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quản lý người dùng</h2>

      {toastMsg && (
        <div
          className={`px-4 py-2 rounded mb-2 text-white ${
            toastMsg.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toastMsg.msg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 bg-white rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Avatar</th>
              <th className="py-2 px-4 border-b">Họ tên</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Vai trò</th>
              <th className="py-2 px-4 border-b">Trạng thái</th>
              <th className="py-2 px-4 border-b">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-700">
                      {user.fullName?.[0] || user.email[0]}
                    </div>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {user.fullName || "Chưa cập nhật"}
                </td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.role}</td>
                <td className="py-2 px-4 border-b">{user.status}</td>
                <td className="py-2 px-4 border-b">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                      onClick={() => handleViewPosts(user)}
                    >
                      Xem bài viết
                    </button>
                    <button
                      className="px-3 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm"
                      onClick={() => handleOpenTransferDialog(user)}
                    >
                      Chuyển bài viết
                    </button>
                    <button
                      className="px-3 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50 text-sm"
                      onClick={() => handleDeleteUser(user.id!)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for user posts */}
      {isPostsDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={closeDialog}
              aria-label="Đóng"
            >
              &times;
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Bài viết của {selectedUser?.fullName || selectedUser?.email}
              </h3>
            </div>
            <div className="mt-4">
              {userPosts.length === 0 ? (
                <p>Người dùng chưa có bài viết nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 bg-white rounded-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b">Tiêu đề</th>
                        <th className="py-2 px-4 border-b">Ngày tạo</th>
                        <th className="py-2 px-4 border-b">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPosts.map((post) => (
                        <tr key={post.slug} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{post.name}</td>
                          <td className="py-2 px-4 border-b">
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">{post.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for transferring posts */}
      {isTransferDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={closeDialog}
              aria-label="Đóng"
            >
              &times;
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Chuyển bài viết của{" "}
                {selectedUser?.fullName || selectedUser?.email}
              </h3>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Chọn người dùng đích:
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">-- Chọn người dùng --</option>
                {users
                  .filter((user) => user.id !== selectedUser?.id)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName ? `${user.fullName} - ${user.email}` : user.email}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4 flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleTransferAllPosts}
              >
                Chuyển tất cả bài viết
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleTransferSelectedPosts}
                disabled={selectedPosts.length === 0}
              >
                Chuyển bài viết đã chọn ({selectedPosts.length})
              </button>
            </div>

            <div className="mt-4">
              {userPosts.length === 0 ? (
                <p>Người dùng chưa có bài viết nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 bg-white rounded-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b w-12">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPosts(
                                  userPosts.map((post) => post._id || post.id)
                                );
                              } else {
                                setSelectedPosts([]);
                              }
                            }}
                            checked={
                              selectedPosts.length === userPosts.length &&
                              userPosts.length > 0
                            }
                          />
                        </th>
                        <th className="py-2 px-4 border-b">Tiêu đề</th>
                        <th className="py-2 px-4 border-b">Ngày tạo</th>
                        <th className="py-2 px-4 border-b">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPosts.map((post) => (
                        <tr key={post.slug} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-center">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(
                                post._id || post.id
                              )}
                              onChange={() =>
                                handleTogglePostSelection(post._id || post.id)
                              }
                            />
                          </td>
                          <td className="py-2 px-4 border-b">{post.name}</td>
                          <td className="py-2 px-4 border-b">
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">{post.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
