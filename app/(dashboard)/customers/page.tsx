"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuPencil, LuTrash2 } from "react-icons/lu";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isEdit, setIsEdit] = useState(false);

    const [form, setForm] = useState({
        name: "",
        phone: "",
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        setLoading(true);
        const { data, error } = await supabase
            .from("customers")
            .select("*")
            .order("id", { ascending: false });

        if (error) toast.error("Failed to fetch customers");
        else setCustomers(data || []);

        setLoading(false);
    }

    async function handleSave() {
        if (!form.phone) {
            return toast.error("Phone is required");
        }

        // duplicate check
        const { data: existing } = await supabase
            .from("customers")
            .select("*")
            .eq("phone", form.phone)
            .single();

        if (existing && !isEdit) {
            return toast.error("Customer already exists");
        }

        let res;

        if (isEdit) {
            res = await supabase
                .from("customers")
                .update(form)
                .eq("id", selectedCustomer.id);
        } else {
            res = await supabase.from("customers").insert([form]);
        }

        if (res.error) {
            toast.error("Save failed");
        } else {
            toast.success(isEdit ? "Updated" : "Added");
            setOpenModal(false);
            fetchCustomers();
        }
    }

    async function handleDelete() {
        const { error } = await supabase
            .from("customers")
            .delete()
            .eq("id", selectedCustomer.id);

        if (error) toast.error("Delete failed");
        else {
            toast.success("Deleted");
            setDeleteModal(false);
            fetchCustomers();
        }
    }

    return (
        <div>
            {/* HEADER */}
            <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">
                    Customers
                </h1>

                <button
                    onClick={() => {
                        setForm({ name: "", phone: "" });
                        setIsEdit(false);
                        setOpenModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                    + Add Customer
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
                                    <th className="p-3 font-semibold">Actions</th>
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
                                                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-6 text-center text-gray-500">
                                            No customers available
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-t border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-semibold text-gray-900">
                                                {c.name || "-"}
                                            </td>

                                            <td className="p-3 text-gray-800">
                                                {c.phone}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-1 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
                                                            setForm({
                                                                name: c.name || "",
                                                                phone: c.phone,
                                                            });
                                                            setIsEdit(true);
                                                            setOpenModal(true);
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-600 transition cursor-pointer"
                                                    >
                                                        <LuPencil size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
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

            {/* ADD / EDIT MODAL */}
            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpenModal(false)}
                    />

                    <div className="relative bg-white w-[95%] max-w-md p-6 rounded-xl shadow-xl border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {isEdit ? "Edit Customer" : "Add Customer"}
                        </h2>

                        <input
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        <input
                            placeholder="Phone"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

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

                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteModal(false)}
                    />

                    <div className="relative bg-white w-full max-w-sm p-6 rounded-xl shadow-xl border">
                        <h2 className="text-lg font-semibold mb-4 text-red-600">
                            Delete Customer?
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