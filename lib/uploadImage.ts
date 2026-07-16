import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

export async function uploadProductImage(file: File) {
    try {
        // 🔥 compress (target 400KB avg)
        const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.6, // max 600KB
            maxWidthOrHeight: 1024,
            useWebWorker: true,
        });

        // ✅ unique file name
        const fileName = `${Date.now()}-${compressedFile.name}`;

        // 🚀 upload
        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, compressedFile);

        if (error) throw error;

        // 🌐 public url
        const { data } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        return data.publicUrl;

    } catch (err) {
        console.error(err);
        throw err;
    }
}