import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { supabase as normalClient } from '$lib/supabase';

// Helper to get an admin bypass client
function getAdminClient() {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in the environment variables.");
    }
    return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function POST({ request }) {
    try {
        // Authenticate request loosely to ensure only logged in users can upload
        const authHeader = request.headers.get('Authorization') || request.headers.get('cookie');

        const adminClient = getAdminClient();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string;
        const folder = formData.get('folder') as string;

        if (!file || !bucket || !folder) {
            return json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        // Ensure bucket exists or create it
        const { data: buckets } = await adminClient.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === bucket);
        if (!bucketExists) {
            await adminClient.storage.createBucket(bucket, { public: true });
        } else if (!bucketExists.public) {
            await adminClient.storage.updateBucket(bucket, { public: true });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const finalPath = `${folder}/${fileName}`;

        const { data, error } = await adminClient.storage
            .from(bucket)
            .upload(finalPath, file);

        if (error) {
            console.error("Storage upload error:", error);
            return json({ success: false, error: error.message }, { status: 500 });
        }

        const { data: publicUrlData } = adminClient.storage
            .from(bucket)
            .getPublicUrl(finalPath);

        return json({ success: true, url: publicUrlData.publicUrl });
    } catch (error: any) {
        console.error("Upload Error API:", error);
        return json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}
