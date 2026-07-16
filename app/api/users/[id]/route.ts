import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // ✅ important fix

    const body = await req.json();

    let updateData: any = {
        name: body.name,
        phone: body.phone,
        role: body.role,
    };

    if (body.password) {
        const hashed = await bcrypt.hash(body.password, 10);
        updateData.password = hashed;
    }

    const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated" });
}