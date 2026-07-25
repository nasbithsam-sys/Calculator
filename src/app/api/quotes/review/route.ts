import { NextResponse } from 'next/server';
import { submitExpertReview } from '@/app/actions/quote';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Server action performs validation
    const result = await submitExpertReview(payload);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
