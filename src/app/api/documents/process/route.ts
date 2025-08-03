import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { processDocument } from '@/lib/document-processor';
import { join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

export const maxDuration = 60; // Set max duration to 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify user authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create temporary directory for file processing
    const tempDir = join(os.tmpdir(), 'clincerta', uuidv4());
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
      return NextResponse.json({ error: 'Failed to create processing directory' }, { status: 500 });
    }

    // Save file to temp directory
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(tempDir, file.name);
    
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    // Process the document
    const { text, metadata } = await processDocument(filePath);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${timestamp}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = await supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl || '';

    // Clean up temp files
    try {
      fs.unlinkSync(filePath);
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      // Continue even if cleanup fails
    }

    // Return processed data
    return NextResponse.json({
      text,
      metadata,
      publicUrl,
      success: true
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}
