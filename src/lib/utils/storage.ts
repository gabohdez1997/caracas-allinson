import { supabase } from "$lib/supabase";

/**
 * Uploads a file to a specified Supabase storage bucket via backend API to bypass RLS.
 * 
 * @param bucketName - The name of the storage bucket
 * @param filePath - The path to save the file as (e.g. 'events' or 'raffles')
 * @param file - The file object to upload
 * @returns An object containing the public URL to the uploaded file, or an error.
 */
export async function uploadImageToStorage(bucketName: string, filePath: string, file: File) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucketName);
        formData.append('folder', filePath);

        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error("Storage upload error:", data.error);
            throw new Error(data.error || "Failed to upload file");
        }

        return { url: data.url, error: null };
    } catch (error) {
        console.error("Image Upload Exception:", error);
        return { url: null, error };
    }
}
