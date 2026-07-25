import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    
    if (!file || !bucket) {
      return NextResponse.json({ error: "File and bucket are required" }, { status: 400 });
    }

    if (bucket !== 'property-photos' && bucket !== 'property-plans') {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    // Validate size and type
    if (bucket === 'property-photos') {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Photo must be less than 5MB" }, { status: 400 });
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        return NextResponse.json({ error: "Invalid photo type" }, { status: 400 });
      }
    } else if (bucket === 'property-plans') {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Plan must be less than 10MB" }, { status: 400 });
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
      }
    }

    // Generate safe unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const extension = file.name.split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get signed URL for preview
    const { data: signedData } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days valid for the preview URL

    return NextResponse.json({ 
      success: true, 
      path: data.path,
      url: signedData?.signedUrl || null
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
