import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;

    // ✅ public route
    if (req.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.next();
    }

    // ❌ no token
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload }: any = await jwtVerify(token, secret);

        const role = payload.role;

        // 🔥 STAFF RESTRICTIONS
        const restrictedForStaff = ["/users", "/customers", "/reports"];

        if (
            role === "staff" &&
            restrictedForStaff.some((path) =>
                req.nextUrl.pathname.startsWith(path)
            )
        ) {
            return NextResponse.redirect(new URL("/not-authorized", req.url));
        }

        return NextResponse.next();
    } catch (err) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/pos/:path*",
        "/orders/:path*",
        "/reports/:path*",
        "/products/:path*",
        "/categories/:path*",
        "/users/:path*",
        "/customers/:path*",
    ],
};