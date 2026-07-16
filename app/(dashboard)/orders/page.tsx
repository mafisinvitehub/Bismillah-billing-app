"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BsWhatsapp } from "react-icons/bs";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewOrder, setViewOrder] = useState<any>(null);
    const [editOrder, setEditOrder] = useState<any>(null);
    const [deleteOrder, setDeleteOrder] = useState<any>(null);

    const [editData, setEditData] = useState({
        discount: "",
        payment_cash: "",
        payment_online: "",
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);

        const { data, error } = await supabase
            .from("orders")
            .select(`
        *,
        customers (name, phone),
        users (name),
        order_items (*)
      `)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to load orders");
        } else {
            setOrders(data || []);
        }

        setLoading(false);
    }

    // DELETE
    async function handleDelete() {
        await supabase.from("order_items").delete().eq("order_id", deleteOrder.id);
        await supabase.from("orders").delete().eq("id", deleteOrder.id);

        toast.success("Deleted");
        setDeleteOrder(null);
        fetchOrders();
    }

    // EDIT OPEN
    function handleEdit(order: any) {
        setEditOrder(order);
        setEditData({
            discount: order.discount,
            payment_cash: order.payment_cash,
            payment_online: order.payment_online,
        });
    }

    // EDIT SAVE
    async function handleEditSave() {
        const newDiscount = Number(editData.discount || 0);

        // ✅ calculate new total
        const newFinalTotal = editOrder.total - newDiscount;

        const totalPaid =
            Number(editData.payment_cash || 0) +
            Number(editData.payment_online || 0);

        // ✅ compare with NEW total (not old)
        if (totalPaid !== newFinalTotal) {
            return toast.error("Payment mismatch");
        }

        await supabase
            .from("orders")
            .update({
                discount: newDiscount,
                final_total: newFinalTotal, // ✅ IMPORTANT
                payment_cash: Number(editData.payment_cash),
                payment_online: Number(editData.payment_online),
            })
            .eq("id", editOrder.id);

        toast.success("Updated");
        setEditOrder(null);
        fetchOrders();
    }

    function handleSendWhatsApp(order: any) {
        if (!order?.customers?.phone) {
            return toast.error("No customer phone");
        }

        // 🕒 Date format
        const billDate = new Date(order.created_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });

        // 🧾 Items
        const itemsText = order.order_items
            .map((i: any) => {
                const total = i.price * i.qty + (i.extra_price || 0);
                return `${i.name} ${i.qty} x ${i.price} = ${total}`;
            })
            .join("\n");

        // ➕ extra total
        const extraTotal = order.order_items.reduce(
            (sum: number, i: any) => sum + (i.extra_price || 0),
            0
        );

        const customerName = order.customers?.name || "Customer";

        // 💬 message
        const message = `
            Hi ${customerName}

            *Bismillah Juice & Snacks*

            *BILL*

            Bill ID: ${order.bill_number}
            Date: ${billDate}

            *Items:*
            ${itemsText}

            Subtotal: ₹${order.total}
            Discount: ₹${order.discount}
            Extra Charges: ₹${extraTotal}

            *Total: ₹${order.final_total}*

            Thank you
        `;

        const text = encodeURIComponent(message);

        window.open(`https://wa.me/91${order.customers.phone}?text=${text}`);
    }

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">Orders</h1>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                        <thead className="bg-gray-100 text-sm text-gray-700">
                            <tr>
                                <th className="p-3 font-semibold">Bill</th>
                                <th className="p-3 font-semibold">Customer</th>
                                <th className="p-3 font-semibold">Total</th>
                                <th className="p-3 font-semibold">Date</th>
                                <th className="p-3 font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-3">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3">
                                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        No Orders Found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-semibold text-gray-900">
                                            {o.bill_number}
                                        </td>

                                        <td className="p-3 text-gray-800">
                                            {o.customers?.name || "No Customer"}
                                        </td>

                                        <td className="p-3 text-gray-800">
                                            ₹{o.final_total}
                                        </td>

                                        <td className="p-3 text-gray-600">
                                            {new Date(o.created_at).toLocaleString()}
                                        </td>

                                        <td className="p-3">
                                            <div className="flex gap-1">

                                                {/* VIEW */}
                                                <button
                                                    onClick={() => setViewOrder(o)}
                                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 cursor-pointer"
                                                >
                                                    <LuEye size={16} />
                                                </button>

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => handleEdit(o)}
                                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-600 cursor-pointer"
                                                >
                                                    <LuPencil size={16} />
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    onClick={() => setDeleteOrder(o)}
                                                    className="p-1 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 cursor-pointer"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>

                                                {/* WHATSAPP */}
                                                <button
                                                    onClick={() => handleSendWhatsApp(o)}
                                                    className="p-1 rounded-lg hover:bg-green-50 text-gray-600 hover:text-green-600 transition cursor-pointer"
                                                >
                                                    <BsWhatsapp size={15} />
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

            {/* ================= VIEW MODAL ================= */}
            {viewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setViewOrder(null)} />

                    <div className="relative bg-white w-full max-w-lg p-6 rounded-xl border">

                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {viewOrder.bill_number}
                        </h2>

                        <p className="text-sm text-gray-700">
                            {viewOrder.customers?.name} - {viewOrder.customers?.phone}
                        </p>

                        <p className="text-xs text-gray-500 mb-3">
                            {new Date(viewOrder.created_at).toLocaleString()}
                        </p>

                        {/* ITEMS */}
                        <div className="border-t pt-2">
                            {viewOrder.order_items.map((i: any) => (
                                <div key={i.id} className="flex justify-between text-sm py-1 text-gray-700">
                                    <span>{i.name} ({i.qty} × {i.price})</span>
                                    <span>₹{i.price * i.qty + (i.extra_price || 0)}</span>
                                </div>
                            ))}
                        </div>

                        {/* TOTAL */}
                        <div className="border-t mt-3 pt-2 text-sm text-gray-700">
                            <p>Subtotal: ₹{viewOrder.total}</p>
                            <p>Discount: ₹{viewOrder.discount}</p>
                            <p className="font-semibold text-gray-900 text-lg">
                                Total: ₹{viewOrder.final_total}
                            </p>
                        </div>

                        {/* PAYMENT */}
                        <div className="text-xs mt-2 text-gray-500">
                            Cash: ₹{viewOrder.payment_cash} | Online: ₹{viewOrder.payment_online}
                        </div>

                        <button
                            onClick={() => setViewOrder(null)}
                            className="w-full mt-4 border border-gray-300 py-2 rounded-lg text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ================= EDIT MODAL ================= */}
            {editOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setEditOrder(null)} />

                    <div className="relative bg-white w-full max-w-md p-6 rounded-xl border">

                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            Edit Bill
                        </h2>

                        <p className="text-xs text-gray-500 mb-3">
                            Bill: {editOrder.bill_number}
                        </p>

                        {/* Discount */}
                        <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">
                                Discount Amount
                            </label>
                            <input
                                placeholder="Enter discount"
                                value={editData.discount}
                                onChange={(e) =>
                                    setEditData({ ...editData, discount: e.target.value })
                                }
                                className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>

                        {/* Cash */}
                        <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">
                                Cash Payment
                            </label>
                            <input
                                placeholder="Enter cash amount"
                                value={editData.payment_cash}
                                onChange={(e) =>
                                    setEditData({ ...editData, payment_cash: e.target.value })
                                }
                                className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>

                        {/* Online */}
                        <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">
                                Online Payment
                            </label>
                            <input
                                placeholder="Enter online amount"
                                value={editData.payment_online}
                                onChange={(e) =>
                                    setEditData({ ...editData, payment_online: e.target.value })
                                }
                                className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditOrder(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleEditSave}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition cursor-pointer"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= DELETE MODAL ================= */}
            {deleteOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteOrder(null)} />

                    <div className="relative bg-white w-full max-w-sm p-6 rounded-xl border">
                        <h2 className="text-lg font-semibold text-red-600 mb-4">
                            Delete Order?
                        </h2>

                        <p className="text-gray-600 mb-4">
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteOrder(null)}
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