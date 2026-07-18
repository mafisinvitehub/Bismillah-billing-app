"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuLogOut } from "react-icons/lu";

const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Billing", path: "/pos" },
    { name: "Orders", path: "/orders" },
    { name: "Reports", path: "/reports" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "Customers", path: "/customers" },
    { name: "Users", path: "/users" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [role, setRole] = useState("");
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        function handleScroll() {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 50) {
                setShowHeader(true);
            } else if (currentScrollY > lastScrollY) {
                setShowHeader(false);
            } else {
                setShowHeader(true);
            }

            setLastScrollY(currentScrollY);
        }

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        if (storedRole) setRole(storedRole);
        if (!storedRole) {
            router.push("/login");
        }
    }, []);

    async function handleLogout() {
        await fetch("/api/logout", {
            method: "POST",
        });
        localStorage.removeItem("role");
        router.push("/login");
    }

    const filteredMenu = menu.filter((item) => {
        if (role === "admin") return true;

        if (role === "staff" && (item.path === "/users" || item.path === "/customers" || item.path === "/reports")) {
            return false;
        }

        return true;
    });

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">

            {/* SIDEBAR */}
            <div className="w-64 bg-white border-r p-4 hidden lg:block">
                {/* <h1 className="text-lg font-bold text-primary mb-6">
                    Bismillah
                </h1> */}
                <div className="flex justify-center mb-6">
                    <img src="/bismillah-logo.jpg" alt="logo" className="w-auto object-contain" />
                </div>
                <nav className="flex flex-col gap-1">
                    {filteredMenu.map((item) => {
                        const active = pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`p-2 rounded-lg transition ${active
                                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* MOBILE DRAWER */}
            <div
                className={`fixed inset-0 z-50 flex transition lg:hidden ${open ? "visible" : "invisible"
                    }`}
            >
                {/* OVERLAY */}
                <div
                    onClick={() => setOpen(false)}
                    className={`flex-1 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"
                        }`}
                />

                {/* DRAWER */}
                <div
                    className={`w-64 bg-white p-4 shadow-lg transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    <div className="flex justify-between items-center mb-6">
                        {/* <h1 className="text-lg font-bold text-primary">Bismillah</h1> */}
                        <img src="/bismillah-logo.jpg" alt="logo" className="w-[80%] object-contain" />
                        <button className="text-primary text-xl" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {filteredMenu.map((item) => {
                            const active = pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setOpen(false)}
                                    className={`p-2 rounded-lg transition transition-all duration-200 ${active
                                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* HEADER */}
                <div
                    className={`
        lg:sticky lg:top-0
        fixed top-0 left-0 right-0 lg:left-64
        z-40 bg-white border-b
        transition-transform duration-300
        ${showHeader ? "translate-y-0" : "-translate-y-full"}
        lg:translate-y-0
    `}
                >
                    <div className="flex justify-between items-center p-4">

                        {/* LEFT */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setOpen(true)}
                                className="lg:hidden text-xl text-primary"
                            >
                                ☰
                            </button>

                            <h2 className="font-semibold text-gray-800 capitalize">
                                {pathname.replace("/", "")}
                            </h2>
                        </div>

                        {/* RIGHT */}
                        <button
                            onClick={handleLogout}
                            className="group border border-transparent text-primary px-4 py-2 rounded-lg flex items-center gap-2 
            hover:bg-primary hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                            <LuLogOut size={20} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 pt-20 lg:pt-4 overflow-x-hidden">{children}</div>
            </div>
        </div>
    );
}