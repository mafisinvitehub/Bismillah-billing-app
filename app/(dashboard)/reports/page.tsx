"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

export default function ReportsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [selectedProduct, setSelectedProduct] = useState("");

    const [orderItems, setOrderItems] = useState<any[]>([]);

    const [summary, setSummary] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalDiscount: 0,
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
                customers (name, phone)
            `)
            .order("created_at", { ascending: false });

        const { data: items } = await supabase
            .from("order_items")
            .select("*");

        if (error) {
            toast.error("Failed to load reports");
        } else {
            setOrders(data || []);
            setFilteredOrders(data || []);
            setOrderItems(items || []);
            calculateSummary(data || []);
        }

        setLoading(false);
    }

    function calculateSummary(data: any[]) {
        const totalSales = data.reduce((sum, o) => sum + (o.final_total || 0), 0);
        const totalDiscount = data.reduce((sum, o) => sum + (o.discount || 0), 0);

        setSummary({
            totalSales,
            totalOrders: data.length,
            totalDiscount,
        });
    }

    // 🔹 APPLY FILTER
    function handleFilter(customFrom?: Date, customTo?: Date) {
        setFilterLoading(true);

        let filtered = [...orders];

        const start = customFrom || (fromDate ? new Date(fromDate) : null);
        const end = customTo || (toDate ? new Date(toDate) : null);

        if (start) {
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(
                (o) => new Date(o.created_at) >= start
            );
        }

        if (end) {
            end.setHours(23, 59, 59, 999); // ✅ FIX
            filtered = filtered.filter(
                (o) => new Date(o.created_at) <= end
            );
        }

        // 🔹 PRODUCT FILTER
        if (selectedProduct) {
            const orderIds = orderItems
                .filter((i) => i.name === selectedProduct)
                .map((i) => i.order_id);

            filtered = filtered.filter((o) =>
                orderIds.includes(o.id)
            );
        }

        setFilteredOrders(filtered);
        calculateSummary(filtered);

        setTimeout(() => setFilterLoading(false), 300);
    }

    // 🔹 QUICK FILTERS
    function filterToday() {
        const today = new Date();
        handleFilter(today, today);
    }

    function filterLast7Days() {
        const today = new Date();
        const last7 = new Date();
        last7.setDate(today.getDate() - 6);

        handleFilter(last7, today);
    }

    function resetFilter() {
        setFromDate("");
        setToDate("");
        setSelectedProduct("");
        setFilteredOrders(orders);
        calculateSummary(orders);
    }

    // 🔹 TOP SELLING ITEMS
    const topItems = useMemo(() => {
        const map: any = {};

        orderItems.forEach((i) => {
            if (!map[i.name]) {
                map[i.name] = 0;
            }
            map[i.name] += i.qty;
        });

        return Object.entries(map)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5);
    }, [orderItems]);

    const productList = [...new Set(orderItems.map((i) => i.name))];

    return (
        <div>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-700">
                    Reports
                </h1>
            </div>

            {/* QUICK FILTERS */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={filterToday}
                    className="border border-gray-300 text-gray-700 px-3 py-1 rounded-lg"
                >
                    Today
                </button>

                <button
                    onClick={filterLast7Days}
                    className="border border-gray-300 text-gray-700 px-3 py-1 rounded-lg"
                >
                    Last 7 Days
                </button>
            </div>

            {/* FILTERS */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">

                <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-gray-700"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-gray-700"
                    />
                </div>

                {/* 🔹 PRODUCT FILTER */}
                <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                        Product
                    </label>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-gray-700"
                    >
                        <option value="">All</option>
                        {productList.map((p, i) => (
                            <option key={i} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => handleFilter()}
                    disabled={filterLoading}
                    className="bg-primary text-white px-4 py-2 rounded-lg"
                >
                    {filterLoading ? "Applying..." : "Apply"}
                </button>

                <button
                    onClick={resetFilter}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                >
                    Reset
                </button>

            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">Total Sales</p>
                    <p className="text-xl font-semibold text-gray-700">
                        ₹{summary.totalSales}
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">Total Orders</p>
                    <p className="text-xl font-semibold text-gray-700">
                        {summary.totalOrders}
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">Total Discount</p>
                    <p className="text-xl font-semibold text-gray-700">
                        ₹{summary.totalDiscount}
                    </p>
                </div>

                {/* 🔹 TOP ITEMS */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700 mb-2">
                        Top Items
                    </p>
                    {topItems.map(([name, qty]: any, i) => (
                        <p key={i} className="text-sm text-gray-700">
                            {name} ({qty})
                        </p>
                    ))}
                </div>

            </div>

            {/* TABLE SAME */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">

                        <thead className="bg-gray-100 text-sm text-gray-700">
                            <tr>
                                <th className="p-3">Bill</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Total</th>
                                <th className="p-3">Cash</th>
                                <th className="p-3">Online</th>
                                <th className="p-3">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.map((o) => (
                                <tr key={o.id} className="border-t">
                                    <td className="p-3 text-gray-700">
                                        {o.bill_number}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        {o.customers?.name || "No Customer"}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        ₹{o.final_total}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        ₹{o.payment_cash}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        ₹{o.payment_online}
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        {new Date(o.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>

        </div>
    );
}