import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    const { filename, bucket, contentType } = await request.json();

    if (!filename || !bucket) {
      return NextResponse.json({ error: "Filename and bucket are required" }, { status: 400 });
    }

    if (bucket !== 'property-videos' && bucket !== 'property-plans' && bucket !== 'property-photos') {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    const extension = String(filename).split('.').pop()?.toLowerCase() || 'bin';
    const allowedExtensions: Record<string, string[]> = {
      'property-photos': ['jpg', 'jpeg', 'png', 'webp'],
      'property-plans': ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      'property-videos': ['mp4', 'mov', 'webm'],
    };
    const allowedTypes: Record<string, string[]> = {
      'property-photos': ['image/jpeg', 'image/png', 'image/webp'],
      'property-plans': ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      'property-videos': ['video/mp4', 'video/quicktime', 'video/webm'],
    };

    if (!allowedExtensions[bucket]?.includes(extension) || !allowedTypes[bucket]?.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const safeName = `draft/${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUploadUrl(safeName);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      token: data.token,
      path: data.path,
      signedUrl: data.signedUrl
    });

  } catch (error) {
    console.error("Upload URL Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
