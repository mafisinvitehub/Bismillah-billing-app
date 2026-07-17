"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const res = await fetch("/api/me");

            if (res.ok) {
                router.replace("/dashboard");
            }
        }

        checkAuth();
    }, []);

    async function handleLogin() {
        setLoading(true);

        const res = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone, password }),
        });

        const data = await res.json();

        setLoading(false);

        if (!res.ok) {
            toast.error(data.error);
        } else {
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.name);
            toast.success("Login successful!");
            router.push("/dashboard");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">

                {/* LOGO */}
                <div className="flex justify-center mb-6">
                    <img src="/bismillah-logo.jpg" alt="logo" className="w-auto object-contain" />
                </div>

                {/* TITLE */}
                {/* <h1 className="text-center text-2xl font-bold text-primary mb-6">
                    Bismillah Juice & Snacks
                </h1> */}

                {/* INPUTS */}
                <input
                    className="w-full p-3 border text-primary rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <div className="relative mb-4">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="w-full p-3 border text-primary rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* EYE ICON */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary cursor-pointer"
                    >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                </div>

                {/* BUTTON */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-primary text-white p-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Logging in...
                        </>
                    ) : (
                        "Login"
                    )}
                </button>
            </div>
        </div>
    );
}