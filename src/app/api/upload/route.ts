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

    if (bucket !== 'property-photos' && bucket !== 'property-plans' && bucket !== 'property-videos') {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const allowedExtensions: Record<string, string[]> = {
      'property-photos': ['jpg', 'jpeg', 'png', 'webp'],
      'property-plans': ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      'property-videos': ['mp4', 'mov', 'webm'],
    };

    if (!allowedExtensions[bucket]?.includes(extension)) {
      return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
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
    } else if (bucket === 'property-videos') {
      if (file.size > 200 * 1024 * 1024) {
        return NextResponse.json({ error: "Video must be less than 200MB" }, { status: 400 });
      }
      if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
        return NextResponse.json({ error: "Invalid video type" }, { status: 400 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const magic = buffer.subarray(0, 12).toString('hex');
    const looksLikeJpeg = magic.startsWith('ffd8ff');
    const looksLikePng = magic.startsWith('89504e470d0a1a0a');
    const looksLikeWebp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    const looksLikePdf = buffer.subarray(0, 4).toString() === '%PDF';
    const looksLikeMp4Mov = buffer.subarray(4, 8).toString() === 'ftyp';
    const looksLikeWebm = magic.startsWith('1a45dfa3');

    const hasValidMagic =
      (bucket === 'property-photos' && (looksLikeJpeg || looksLikePng || looksLikeWebp)) ||
      (bucket === 'property-plans' && (looksLikePdf || looksLikeJpeg || looksLikePng || looksLikeWebp)) ||
      (bucket === 'property-videos' && (looksLikeMp4Mov || looksLikeWebm));

    if (!hasValidMagic) {
      return NextResponse.json({ error: "File content does not match the selected type" }, { status: 400 });
    }
    
    const safeName = `draft/${crypto.randomUUID()}.${extension}`;

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

    return NextResponse.json({ 
      success: true, 
      path: data.path,
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
