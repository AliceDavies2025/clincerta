import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from '@/lib/document-processor';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Disable body parsing since we'll handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Save uploaded file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create temp file
    const tempFilePath = join(tmpdir(), `${randomUUID()}-${file.name}`);
    await writeFile(tempFilePath, buffer);
    
    // Process document
    const processedDocument = await processDocument(tempFilePath);
    
    let documentId = null;
    
    // Store in database if authenticated
    if (session?.user) {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${randomUUID()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinical-documents')
        .upload(filePath, buffer);
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload document' },
          { status: 500 }
        );
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('clinical-documents')
        .getPublicUrl(filePath);
      
      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: session.user.id,
          title: file.name,
          file_type: file.type,
          file_url: publicUrl,
          text_content: processedDocument.text.substring(0, 10000), // First 10K chars
          is_scanned_document: processedDocument.metadata.isScanned || false,
          ocr_applied: processedDocument.metadata.ocrApplied || false,
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json(
          { error: 'Failed to save document to database' },
          { status: 500 }
        );
      }
      
      documentId = dbData.id;
    }
    
    // Return processed document data
    return NextResponse.json({
      success: true,
      documentId,
      text: processedDocument.text,
      metadata: processedDocument.metadata,
    });
    
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
