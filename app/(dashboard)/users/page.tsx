"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        role: "staff",
        password: "",
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);

        const { data, error } = await supabase
            .from("users")
            .select("id, name, phone, role")
            .order("id", { ascending: false });

        if (error) {
            toast.error("Failed to fetch users");
        } else {
            setUsers(data);
        }

        setLoading(false);
    }

    async function handleAddUser() {
        if (!form.name.trim()) {
            return setError("Name is required");
        }

        if (!form.phone.trim()) {
            return setError("Phone is required");
        }

        if (form.phone.length < 10) {
            return setError("Invalid phone number");
        }

        if (!form.password.trim()) {
            return setError("Password is required");
        }

        if (form.password.length < 4) {
            return setError("Password must be at least 4 characters");
        }

        const res = await fetch("/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.error || "Failed to add user");
        } else {
            toast.success("User added successfully");
            setForm({ name: "", phone: "", role: "staff", password: "" });
            setOpenModal(false);
            fetchUsers();
        }
    }

    async function handleUpdateUser() {
        if (!form.name.trim()) {
            return setError("Name required");
        }

        const payload: any = {
            name: form.name,
            phone: form.phone,
            role: form.role,
        };

        // ✅ only if password entered → send
        if (form.password.trim()) {
            payload.password = form.password;
        }

        const res = await fetch(`/api/users/${selectedUser.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.error || "Update failed");
        } else {
            toast.success("User updated");
            setOpenModal(false);
            setSelectedUser(null);
            fetchUsers();
        }
    }

    async function handleDeleteUser() {
        const { error } = await supabase
            .from("users")
            .delete()
            .eq("id", selectedUser.id);

        if (error) {
            toast.error("Delete failed");
        } else {
            toast.success("User deleted");
            setDeleteModal(false);
            fetchUsers();
        }
    }

    return (
        <div>
            {/* HEADER */}
            <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">Users</h1>

                <button
                    onClick={() => {
                        setError("");
                        setIsEdit(false);
                        setForm({ name: "", phone: "", role: "staff", password: "" });
                        setOpenModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                    + Add User
                </button>
            </div>

            {/* TABLE */}
            <div className="w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[650px] text-left">
                            <thead className="bg-gray-100 text-sm text-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 font-semibold">Name</th>
                                    <th className="p-3 font-semibold">Phone</th>
                                    {/* <th className="p-3 font-semibold">Password</th> */}
                                    <th className="p-3 font-semibold">Role</th>
                                    <th className="p-3 font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-3">
                                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            </td>

                                            <td className="p-3">
                                                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                                            </td>

                                            <td className="p-3">
                                                <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <div className="w-7 h-7 rounded bg-gray-200 animate-pulse"></div>
                                                    <div className="w-7 h-7 rounded bg-gray-200 animate-pulse"></div>
                                                    <div className="w-7 h-7 rounded bg-gray-200 animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-t border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-semibold text-gray-900">
                                                {user.name}
                                            </td>

                                            <td className="p-3 text-gray-800">
                                                {user.phone}
                                            </td>

                                            <td className="p-3">
                                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-1 items-center">

                                                    {/* VIEW */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setViewModal(true);
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition cursor-pointer"
                                                    >
                                                        <LuEye size={16} />
                                                    </button>

                                                    {/* EDIT */}
                                                    <button
                                                        onClick={() => {
                                                            setError("");
                                                            setSelectedUser(user);

                                                            setForm({
                                                                name: user.name,
                                                                phone: user.phone,
                                                                role: user.role,
                                                                password: ""
                                                            });

                                                            setIsEdit(true);
                                                            setOpenModal(true);
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-600 transition cursor-pointer"
                                                    >
                                                        <LuPencil size={16} />
                                                    </button>

                                                    {/* DELETE */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setDeleteModal(true);
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition cursor-pointer"
                                                    >
                                                        <LuTrash2 size={16} />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpenModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white w-[95%] max-w-md p-6 rounded-xl shadow-xl border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {isEdit ? "Edit User" : "Add User"}
                        </h2>

                        {/* Name */}
                        <input
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Phone */}
                        <input
                            placeholder="Phone"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Password */}
                        <div className="relative mb-2">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full p-3 border border-gray-300 text-gray-300 text-gray-900 rounded-lg pr-12 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                            />

                            {/* EYE ICON */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary cursor-pointer"
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        {isEdit && (
                            <p className="text-xs text-gray-500 mb-4">
                                Leave blank to keep current password
                            </p>
                        )}

                        {/* Role */}
                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                        </select>

                        {/* Error */}
                        {error && (
                            <p className="text-red-500 text-sm mb-2">{error}</p>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={isEdit ? handleUpdateUser : handleAddUser}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition cursor-pointer"
                            >
                                {isEdit ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setViewModal(false)} />

                    <div className="relative bg-white w-full max-w-md p-6 rounded-xl shadow-xl border">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">User Details</h2>

                        <p className="mb-2 text-gray-800">
                            <span className="font-semibold text-gray-900">Name:</span> {selectedUser.name}
                        </p>

                        <p className="mb-2 text-gray-800">
                            <span className="font-semibold text-gray-900">Phone:</span> {selectedUser.phone}
                        </p>

                        <p className="mb-4 text-gray-800">
                            <span className="font-semibold text-gray-900">Role:</span> {selectedUser.role}
                        </p>

                        <button
                            onClick={() => setViewModal(false)}
                            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteModal(false)} />

                    <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl border">
                        <h2 className="text-lg font-semibold mb-4 text-red-600">
                            Delete User?
                        </h2>

                        <p className="text-gray-600 mb-4">
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteModal(false)}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDeleteUser}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}