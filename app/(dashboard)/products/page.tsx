"use client";

import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuPencil, LuTrash2 } from "react-icons/lu";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        name: "",
        price: "",
        category_id: "",
        image: "",
        is_popular: false,
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data } = await supabase
            .from("products")
            .select("*, categories(name)")
            .order("id", { ascending: false });

        setProducts(data || []);
        setLoading(false);
    }

    async function fetchCategories() {
        const { data } = await supabase.from("categories").select("*");
        setCategories(data || []);
    }

    // 🔥 IMAGE UPLOAD FIXED
    async function uploadImage(file: File) {
        try {
            const allowed = ["image/jpeg", "image/png", "image/webp"];
            if (!allowed.includes(file.type)) {
                toast.error("Only JPG, PNG, WEBP allowed");
                return null;
            }

            const compressed = await imageCompression(file, {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            });

            const fileName = `${Date.now()}-${compressed.name}`;

            const { error } = await supabase.storage
                .from("products")
                .upload(fileName, compressed);

            if (error) throw error;

            const { data } = supabase.storage
                .from("products")
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (err) {
            toast.error("Image upload failed");
            return null;
        }
    }

    async function handleSave() {
        if (!form.name || !form.price || !form.category_id) {
            return toast.error("Fill all required fields");
        }

        let imageUrl: string | null = "";

        if (imageFile) {
            toast.loading("Uploading...");
            imageUrl = await uploadImage(imageFile);
            toast.dismiss();

            if (!imageUrl) return;
        }

        const payload = {
            ...form,
            price: Number(form.price),
            image: imageUrl,
        };

        let res;

        if (isEdit) {
            res = await supabase
                .from("products")
                .update(payload)
                .eq("id", selected.id);
        } else {
            res = await supabase.from("products").insert([payload]);
        }

        if (res.error) {
            toast.error("Save failed");
        } else {
            toast.success(isEdit ? "Updated" : "Added");
            setOpenModal(false);
            fetchProducts();
        }
    }

    async function handleDelete() {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", selected.id);

        if (error) toast.error("Delete failed");
        else {
            toast.success("Deleted");
            setDeleteModal(false);
            fetchProducts();
        }
    }

    return (
        <div>
            {/* HEADER */}
            <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">
                    Products
                </h1>

                <button
                    onClick={() => {
                        setForm({
                            name: "",
                            price: "",
                            category_id: "",
                            image: "",
                            is_popular: false,
                        });
                        setIsEdit(false);
                        setOpenModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                    + Add Product
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left">
                        <thead className="bg-gray-100 text-sm text-gray-700 sticky top-0">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Image</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Popular</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-t border-gray-200">
                                        <td className="p-3">
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                                <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        No products available
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-t border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        <td className="p-3 font-semibold text-gray-900">
                                            {p.name}
                                        </td>

                                        <td className="p-3">
                                            {p.image ? (
                                                <img
                                                    src={p.image}
                                                    alt={p.name}
                                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                                                    N/A
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3 text-gray-800">
                                            {p.categories?.name}
                                        </td>

                                        <td className="p-3 text-gray-800">
                                            ₹{p.price}
                                        </td>

                                        <td className="p-3">
                                            {p.is_popular ? (
                                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    Popular
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td className="p-3">
                                            <div className="flex gap-1 items-center">
                                                <button
                                                    onClick={() => {
                                                        setSelected(p);
                                                        setForm({
                                                            name: p.name,
                                                            price: p.price,
                                                            category_id: p.category_id,
                                                            image: p.image,
                                                            is_popular: p.is_popular,
                                                        });
                                                        setImageFile(null);
                                                        setIsEdit(true);
                                                        setOpenModal(true);
                                                    }}
                                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-600 transition cursor-pointer"
                                                >
                                                    <LuPencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelected(p);
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

            {/* MODAL */}
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
                            {isEdit ? "Edit Product" : "Add Product"}
                        </h2>

                        {/* Name */}
                        <input
                            placeholder="Product Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Price */}
                        <input
                            type="number"
                            placeholder="Price"
                            value={form.price}
                            onChange={(e) =>
                                setForm({ ...form, price: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Category */}
                        <select
                            value={form.category_id}
                            onChange={(e) =>
                                setForm({ ...form, category_id: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Image */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setImageFile(e.target.files?.[0] || null)
                            }
                            className="w-full mb-3 text-sm text-gray-600"
                        />

                        {(imageFile || form.image) && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Preview</p>

                                <img
                                    src={
                                        imageFile
                                            ? URL.createObjectURL(imageFile)
                                            : form.image
                                    }
                                    alt="preview"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                            </div>
                        )}

                        {/* Popular */}
                        <label className="flex items-center gap-2 mb-3 text-gray-700">
                            <input
                                type="checkbox"
                                checked={form.is_popular}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        is_popular: e.target.checked,
                                    })
                                }
                            />
                            Mark as Popular
                        </label>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition cursor-pointer"
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
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteModal(false)} />

                    <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl border">
                        <h2 className="text-lg font-semibold mb-4 text-red-600">
                            Delete Product?
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
                                onClick={handleDelete}
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