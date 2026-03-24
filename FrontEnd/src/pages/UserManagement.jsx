import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { success, error, confirm } from "../utils/toast.jsx";
import "../styles/user-management.css";
import EyeIcon from "../assets/eye-user-details.svg";
import LoginIcon from "../assets/login-into-any-user.svg";
import ActivateIcon from "../assets/activate.svg";
import DeactivateIcon from "../assets/de-activate.svg";
import DeleteUserIcon from "../assets/delete-user.svg";

const UserManagement = () => {
  const { user: currentUser, login } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({
    role: "",
    search: "",
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roleSelectRef = React.useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, filter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".custom-select")) {
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: 10,
          role: filter.role || undefined,
          search: filter.search || undefined,
        },
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleRoleSelect = (role) => {
    setFilter((prev) => ({ ...prev, role }));
    setPage(1);
    setShowRoleDropdown(false);
  };

  const toggleRoleDropdown = () => {
    setShowRoleDropdown(!showRoleDropdown);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleLoginAsUser = async (user, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    confirm(`Login as ${user.name}?`, async () => {
      try {
        console.log("🔑 Starting login as:", user.name);

        // Use api (axios with Vite proxy) — avoids CORS issues
        const response = await api.post("/admin/login-as", {
          userId: user._id,
        });
        const { token: newToken, user: userData } = response.data;

        // Clear and save new credentials
        localStorage.clear();
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));

        console.log("✅ Logged in as:", userData.name, "— navigating...");

        // Redirect to the correct dashboard for the impersonated role
        const dashMap = {
          superAdmin: "/dashboard/super-admin",
          admin: "/dashboard/admin",
          manager: "/dashboard/manager",
          user: "/dashboard/user",
        };
        window.location.href = dashMap[userData.role] || "/dashboard/user";
      } catch (err) {
        console.error("❌ Login-as error:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message;
        error("Login failed: " + msg);
      }
    });

    return true;
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    confirm(
      `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this user?`,
      async () => {
        try {
          await api.put(`/admin/users/${userId}/manage`, {
            isActive: !currentStatus,
          });
          success(
            `User ${currentStatus ? "deactivated" : "activated"} successfully`,
          );
          fetchUsers();
        } catch (error) {
          error("Error updating user status");
        }
      },
    );
  };

  const handleChangeRole = async (userId, newRole) => {
    confirm(`Change user role to ${newRole}?`, async () => {
      try {
        await api.put(`/admin/users/${userId}/manage`, {
          role: newRole,
        });
        success("User role updated successfully");
        fetchUsers();
      } catch (error) {
        error("Error changing user role");
      }
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", newUser);
      success("User created successfully");
      setShowModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
      });
      fetchUsers();
    } catch (error) {
      error("Error creating user");
    }
  };

  const handleDeleteUser = async (userId) => {
    confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          success("User deleted successfully");
          fetchUsers();
        } catch (error) {
          error("Error deleting user");
        }
      },
    );
  };

  return (
    <section className="user-management-page">
      <div className="container">
        <div className="page-header">
          <h1>User Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
          >
            Add New User
          </button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Role Filter:</label>
            <div className="custom-select" ref={roleSelectRef}>
              <div
                className={`custom-select-trigger ${showRoleDropdown ? "active" : ""}`}
                onClick={toggleRoleDropdown}
              >
                {filter.role || "All Roles"}
                <svg
                  className="arrow"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <path d="M6 9L1 4h10z" fill="#667eea" />
                </svg>
              </div>
              {showRoleDropdown && (
                <div className="custom-select-options">
                  <div
                    className={`custom-select-option ${!filter.role ? "selected" : ""}`}
                    onClick={() => handleRoleSelect("")}
                  >
                    All Roles
                  </div>
                  <div
                    className={`custom-select-option ${filter.role === "user" ? "selected" : ""}`}
                    onClick={() => handleRoleSelect("user")}
                  >
                    User
                  </div>
                  <div
                    className={`custom-select-option ${filter.role === "manager" ? "selected" : ""}`}
                    onClick={() => handleRoleSelect("manager")}
                  >
                    Manager
                  </div>
                  <div
                    className={`custom-select-option ${filter.role === "admin" ? "selected" : ""}`}
                    onClick={() => handleRoleSelect("admin")}
                  >
                    Admin
                  </div>
                  <div
                    className={`custom-select-option ${filter.role === "superAdmin" ? "selected" : ""}`}
                    onClick={() => handleRoleSelect("superAdmin")}
                  >
                    Super Admin
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Search by name..."
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Total Spent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={!user.isActive ? "inactive" : ""}
                    >
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${user.isActive ? "active" : "inactive"}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>₹{user.totalSpent?.toFixed(2) || "0.00"}</td>
                      <td className="actions">
                        <button
                          className="btn-icon view"
                          onClick={() => handleUserClick(user)}
                          title="View Details"
                        >
                          <img
                            src={EyeIcon}
                            alt="View"
                            className="btn-icon-svg"
                          />
                        </button>
                        {user._id !== currentUser?._id && (
                          <>
                            {/* Hide "Login as this user" button for Super Admin users */}
                            {user.role !== "superAdmin" && (
                              <button
                                className="btn-icon login"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return handleLoginAsUser(user, e);
                                }}
                                title="Login as this user"
                              >
                                <img
                                  src={LoginIcon}
                                  alt="Login"
                                  className="btn-icon-svg"
                                />
                              </button>
                            )}
                            {/* Hide role dropdown for Super Admin users - their role cannot be changed */}
                            {user.role !== "superAdmin" && (
                              <select
                                className="role-select"
                                value={user.role}
                                onChange={(e) =>
                                  handleChangeRole(user._id, e.target.value)
                                }
                              >
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                                {currentUser?.role === "superAdmin" && (
                                  <option value="superAdmin">
                                    Super Admin
                                  </option>
                                )}
                              </select>
                            )}
                            <button
                              className={`btn-icon ${user.isActive ? "deactivate" : "activate"}`}
                              onClick={() =>
                                handleToggleStatus(user._id, user.isActive)
                              }
                              title={user.isActive ? "Deactivate" : "Activate"}
                            >
                              <img
                                src={
                                  user.isActive ? DeactivateIcon : ActivateIcon
                                }
                                alt={user.isActive ? "Deactivate" : "Activate"}
                                className="btn-icon-svg"
                              />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                            >
                              <img
                                src={DeleteUserIcon}
                                alt="Delete"
                                className="btn-icon-svg"
                              />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedUser ? "User Details" : "Create New User"}</h2>

            {selectedUser ? (
              <div className="user-details">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <label>Role:</label>
                  <span className={`role-badge ${selectedUser.role}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span
                    className={`status-badge ${selectedUser.isActive ? "active" : "inactive"}`}
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Phone:</label>
                  <span>{selectedUser.phoneNumber || "Not provided"}</span>
                </div>
                <div className="detail-row">
                  <label>Address:</label>
                  <span>
                    {selectedUser.address
                      ? `${selectedUser.address.street}, ${selectedUser.address.city}, ${selectedUser.address.state} ${selectedUser.address.zipCode}, ${selectedUser.address.country}`
                      : "Not provided"}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Joined:</label>
                  <span>
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Last Login:</label>
                  <span>
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Total Spent:</label>
                  <span>₹{selectedUser.totalSpent?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="detail-row">
                  <label>Orders:</label>
                  <span>{selectedUser.purchaseHistory?.length || 0}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                        minLength="6"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        <img
                          src={EyeIcon}
                          alt={showPassword ? "Hide password" : "Show password"}
                          className="password-toggle-icon"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      {currentUser?.role === "superAdmin" && (
                        <option value="superAdmin">Super Admin</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newUser.isActive}
                      onChange={(e) =>
                        setNewUser({ ...newUser, isActive: e.target.checked })
                      }
                    />
                    Active User
                  </label>
                </div>
              </form>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              {!selectedUser && (
                <button className="btn btn-primary" onClick={handleCreateUser}>
                  Create User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserManagement;
