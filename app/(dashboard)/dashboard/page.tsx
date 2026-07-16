"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, } from "recharts";

const COLORS = ["#22c55e", "#3b82f6"];

export default function DashboardPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);

        const { data: o } = await supabase.from("orders").select("*");
        const { data: i } = await supabase.from("order_items").select("*");
        const { data: c } = await supabase.from("customers").select("*");

        const userId = localStorage.getItem("user_id");

        if (userId) {
            const { data: user } = await supabase
                .from("users")
                .select("name")
                .eq("id", userId)
                .single();

            setUserName(user?.name || "User");
        }

        setOrders(o || []);
        setItems(i || []);
        setCustomers(c || []);

        setLoading(false);
    }

    // 🟢 TODAY
    const today = new Date();
    const todayOrders = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.toDateString() === today.toDateString();
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + o.final_total, 0);

    // 🟡 YESTERDAY
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const yesterdayOrders = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.toDateString() === yesterday.toDateString();
    });

    const yesterdaySales = yesterdayOrders.reduce(
        (sum, o) => sum + o.final_total,
        0
    );

    // 📈 GROWTH
    const growth =
        yesterdaySales === 0
            ? 100
            : ((todaySales - yesterdaySales) / yesterdaySales) * 100;

    // 🟣 MONTH
    const month = today.getMonth();
    const year = today.getFullYear();

    const monthOrders = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const monthSales = monthOrders.reduce(
        (sum, o) => sum + o.final_total,
        0
    );

    // 💰 AVG BILL
    const avgBill =
        orders.length > 0
            ? orders.reduce((sum, o) => sum + o.final_total, 0) / orders.length
            : 0;

    // 💳 PAYMENT SPLIT
    const totalCash = orders.reduce((sum, o) => sum + o.payment_cash, 0);
    const totalOnline = orders.reduce((sum, o) => sum + o.payment_online, 0);
    const paymentData = [
        { name: "Cash", value: totalCash },
        { name: "Online", value: totalOnline },
    ];

    // 🔥 TOP PRODUCT (TODAY)
    const topProduct = useMemo(() => {
        const map: any = {};

        items.forEach((i) => {
            const order = orders.find((o) => o.id === i.order_id);
            if (!order) return;

            const d = new Date(order.created_at);
            if (d.toDateString() !== today.toDateString()) return;

            if (!map[i.name]) map[i.name] = 0;
            map[i.name] += i.qty;
        });

        return Object.entries(map).sort((a: any, b: any) => b[1] - a[1])[0];
    }, [items, orders]);

    // 🧾 RECENT
    const recent = [...orders]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
        .slice(0, 5);

    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));

        const dayOrders = orders.filter((o) => {
            const od = new Date(o.created_at);
            return od.toDateString() === d.toDateString();
        });

        return {
            date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            sales: dayOrders.reduce((sum, o) => sum + o.final_total, 0),
        };
    });

    if (loading) {
        return (
            <div className="p-4 space-y-4">

                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                            <div className="h-5 bg-gray-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>

                <div className="h-40 bg-white rounded-xl border animate-pulse" />

            </div>
        );
    }

    return (
        <div className="p-4">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">

                <div>
                    <h1 className="text-2xl font-semibold text-gray-700">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-700">
                        Welcome back, {userName} 👋
                    </p>
                </div>

                <p className="text-sm text-gray-700">
                    {new Date().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </p>

            </div>

            {/* TOP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">

                <Card title="Today Sales" value={`₹${todaySales}`} />
                <Card title="Today Orders" value={todayOrders.length} />
                <Card title="Month Sales" value={`₹${monthSales}`} />
                <Card title="Customers" value={customers.length} />

            </div>

            {/* SECOND ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">

                <Card
                    title="Growth"
                    value={`${growth.toFixed(1)}%`}
                    extra={growth >= 0 ? "📈" : "📉"}
                />

                <Card
                    title="Avg Bill"
                    value={`₹${avgBill.toFixed(0)}`}
                />

                <Card
                    title="Cash vs Online"
                    value={`₹${totalCash} / ₹${totalOnline}`}
                />

                <Card
                    title="Top Product Today"
                    value={topProduct ? topProduct[0] : "-"}
                />

            </div>

            {/* RECENT ORDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* 📊 SALES BAR CHART */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">

                    <p className="text-sm font-semibold text-gray-700 mb-3">
                        Last 7 Days Sales
                    </p>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last7DaysData}>
                                <XAxis dataKey="date" stroke="#374151" />
                                <YAxis stroke="#374151" />
                                <Tooltip />
                                <Bar dataKey="sales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* 💳 PAYMENT PIE */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">

                    <p className="text-sm font-semibold text-gray-700 mb-3">
                        Payment Split
                    </p>

                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={80}
                                    label
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                </div>

            </div>

            {/* 🧾 RECENT ORDERS */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4">

                <p className="text-sm font-semibold text-gray-700 mb-3">
                    Recent Orders
                </p>

                {recent.map((o) => (
                    <div
                        key={o.id}
                        className="flex justify-between text-sm text-gray-700 border-b py-2"
                    >
                        <span>{o.bill_number}</span>
                        <span>₹{o.final_total}</span>
                    </div>
                ))}

            </div>

        </div>
    );
}

// 🔹 CARD COMPONENT
function Card({ title, value, extra }: any) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200">

            <p className="text-xs text-gray-700 mb-1 tracking-wide">
                {title}
            </p>

            <p className="text-2xl font-semibold text-gray-700">
                {value}
                {extra && (
                    <span className="text-sm ml-1">
                        {extra}
                    </span>
                )}
            </p>

        </div>
    );
}