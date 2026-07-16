"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuPencil, LuTrash2 } from "react-icons/lu";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);

        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            toast.error("Failed to fetch categories");
        } else {
            setCategories(data);
        }

        setLoading(false);
    }

    async function handleAdd() {
        if (!form.name.trim()) {
            return setError("Category name required");
        }

        const { error } = await supabase
            .from("categories")
            .insert([form]);

        if (error) {
            toast.error("Failed to add category");
        } else {
            toast.success("Category added successfully");
            setForm({ name: "", description: "" });
            setOpenModal(false);
            fetchCategories();
        }
    }

    async function handleUpdate() {
        if (!form.name.trim()) {
            return setError("Category name required");
        }

        const { error } = await supabase
            .from("categories")
            .update(form)
            .eq("id", selectedCategory.id);

        if (error) {
            toast.error("Update failed");
        } else {
            toast.success("Category updated");
            setOpenModal(false);
            fetchCategories();
        }
    }

    async function handleDelete() {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", selectedCategory.id);

        if (error) {
            toast.error("Delete failed");
        } else {
            toast.success("Category deleted");
            setDeleteModal(false);
            fetchCategories();
        }
    }

    return (
        <div>
            {/* HEADER */}
            <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">
                    Categories
                </h1>

                <button
                    onClick={() => {
                        setError("");
                        setIsEdit(false);
                        setForm({ name: "", description: "" });
                        setOpenModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                    + Add Category
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
                                    <th className="p-3 font-semibold">
                                        Description
                                    </th>
                                    <th className="p-3 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-3">
                                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            </td>
                                            <td className="p-3">
                                                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No categories found
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((cat) => (
                                        <tr
                                            key={cat.id}
                                            className="border-t border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-semibold text-gray-900">
                                                {cat.name}
                                            </td>

                                            <td className="p-3 text-gray-800">
                                                {cat.description}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-1 items-center">
                                                    {/* EDIT */}
                                                    <button
                                                        onClick={() => {
                                                            setError("");
                                                            setSelectedCategory(cat);
                                                            setForm({
                                                                name: cat.name,
                                                                description:
                                                                    cat.description || "",
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
                                                            setSelectedCategory(cat);
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

            {/* MODAL */}
            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpenModal(false)}
                    />

                    <div className="relative bg-white w-[95%] max-w-md p-6 rounded-xl shadow-xl border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {isEdit ? "Edit Category" : "Add Category"}
                        </h2>

                        <input
                            placeholder="Category Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        <input
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {error && (
                            <p className="text-red-500 text-sm mb-2">
                                {error}
                            </p>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={isEdit ? handleUpdate : handleAdd}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                            >
                                {isEdit ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteModal(false)}
                    />

                    <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl border">
                        <h2 className="text-lg font-semibold mb-4 text-red-600">
                            Delete Category?
                        </h2>

                        <p className="text-gray-600 mb-4">
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteModal(false)}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
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