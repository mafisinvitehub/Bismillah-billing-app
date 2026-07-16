import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ secure supabase (server side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT
);

export async function POST(req: Request) {
    try {
        const { phone, password } = await req.json();

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Phone & Password required" },
                { status: 400 }
            );
        }

        // ✅ find user by phone
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // ✅ compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        // ✅ create JWT (5 days)
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "5d",
            }
        );

        const response = NextResponse.json({
            message: "Login success",
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
            },
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // ✅ FIX
            sameSite: "lax", // ✅ FIX (not strict)
            path: "/",
            maxAge: 60 * 60 * 24 * 5,
        });

        return response;
    } catch (err) {
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}