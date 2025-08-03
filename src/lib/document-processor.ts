/**
 * Document Processing Service
 * Handles advanced document processing, text extraction, and analysis
 */

import { getDocument } from 'pdfjs-dist';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createWorker } from 'tesseract.js';
import { fromBase64 } from 'pdf2pic';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

// Convert callback-based functions to Promise-based
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exec = promisify(execCallback);

interface ProcessedDocument {
  text: string;
  metadata: {
    isScanned: boolean;
    ocrApplied: boolean;
    pageCount?: number;
    fileType: string;
    fileSize: number;
  };
}

/**
 * Process a document file and extract its text content
 */
export async function processDocument(filePath: string): Promise<ProcessedDocument> {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    
    // Default metadata
    const metadata = {
      isScanned: false,
      ocrApplied: false,
      pageCount: 0, // Add pageCount with default value
      fileType: fileExt.replace('.', ''),
      fileSize
    };

    let text = '';

    if (fileExt === '.pdf') {
      // Process PDF
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = await getDocument({ data }).promise;
      
      metadata.pageCount = pdf.numPages;
      
      // Extract text from each page
      let pdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pdfText += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      
      // If very little text extracted, it might be a scanned PDF
      if (pdfText.trim().length < 100 && pdf.numPages > 0) {
        metadata.isScanned = true;
        metadata.ocrApplied = true;
        
        // Apply OCR to the first page as a test
        text = await extractTextWithOCR(filePath);
      } else {
        text = pdfText;
      }
    } else if (fileExt === '.docx') {
      // Process DOCX
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileExt === '.doc') {
      // Process legacy DOC format
      try {
        // Attempt to process with pandoc if available
        text = await processDocWithPandoc(filePath);
      } catch (error) {
        // Fallback to treating as plain text
        text = fs.readFileSync(filePath, 'utf8');
      }
    } else if (fileExt === '.txt') {
      // Process TXT as plain text
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      // Unsupported format
      text = `Unsupported file format: ${fileExt}`;
    }

    return {
      text,
      metadata
    };
  } catch (error) {
    console.error('Document processing error:', error);
    return {
      text: 'Error processing document',
      metadata: {
        isScanned: false,
        ocrApplied: false,
        pageCount: 0,
        fileType: path.extname(filePath).replace('.', ''),
        fileSize: 0
      }
    };
  }
}

/**
 * Extract text from images using OCR
 */
async function extractTextWithOCR(pdfPath: string): Promise<string> {
  try {
    // Create a worker for OCR
    const worker = await createWorker('eng');
    let fullText = '';
    
    // Convert PDF to images and perform OCR
    // We're using a simpler approach here to avoid filesystem issues
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');
    
    // Only process first page for speed in this example
    const options = {
      density: 300,
      quality: 100,
      format: 'png',
      width: 2000,
      height: 2000
    };
    
    // Check if pdf2pic has fromBase64 method (might be undefined in some environments)
    if (typeof fromBase64 === 'function') {
      const convert = fromBase64(base64Pdf, options);
      const pageData = await convert(1);
      
      // Different versions of pdf2pic have different response formats
      // Handle both possibilities
      if (pageData) {
        if ('base64' in pageData) {
          const { data } = await worker.recognize((pageData as any).base64);
          fullText += data.text + '\n';
        } else if ('path' in pageData) {
          const { data } = await worker.recognize((pageData as any).path);
          fullText += data.text + '\n';
        } else {
          // Direct buffer recognition as fallback
          const { data } = await worker.recognize(pdfBuffer);
          fullText += data.text + '\n';
        }
      }
    } else {
      // Fallback method if pdf2pic doesn't work
      fullText = "OCR processing unavailable in this environment.";
    }
    
    await worker.terminate();
    return fullText;
  } catch (error) {
    console.error('OCR error:', error);
    return 'Error performing OCR on document';
  }
}

/**
 * Process DOC files using Pandoc if available
 */
async function processDocWithPandoc(filePath: string): Promise<string> {
  try {
    // Check if pandoc is available
    await exec('pandoc --version');
    
    // Create temp file for output
    const tempFile = path.join(os.tmpdir(), `${Date.now()}.txt`);
    
    // Convert DOC to TXT using pandoc
    await exec(`pandoc -f doc -t plain "${filePath}" -o "${tempFile}"`);
    
    // Read the converted text
    const text = await readFile(tempFile, 'utf-8');
    
    // Clean up
    await unlink(tempFile);
    
    return text;
  } catch (error) {
    console.error('Pandoc processing error:', error);
    throw error; // Let the caller handle the fallback
  }
}

/**
 * Extract specific clinical data from text using pattern matching
 */
export function extractClinicalData(text: string): Record<string, any> {
  // Example patterns for clinical data extraction
  // This would be expanded based on specific requirements
  const data: Record<string, any> = {};
  
  // Patient ID pattern (e.g. "Patient ID: 12345" or "MRN: 12345")
  const patientIdMatch = text.match(/(?:Patient(?:\s+)?ID|MRN)(?:\s*)?[:#](?:\s*)?([A-Z0-9-]+)/i);
  if (patientIdMatch) data.patientId = patientIdMatch[1];
  
  // Date pattern (e.g. "Date: 2023-01-15" or "DOB: 01/15/2023")
  const dateMatch = text.match(/(?:Date|DOB)(?:\s*)?[:#](?:\s*)?(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})/i);
  if (dateMatch) data.date = dateMatch[1];
  
  // Age pattern
  const ageMatch = text.match(/(?:Age)(?:\s*)?[:#](?:\s*)?(\d+)(?:\s*)?(?:years|yrs)?/i);
  if (ageMatch) data.age = parseInt(ageMatch[1]);
  
  // Gender pattern
  const genderMatch = text.match(/(?:Gender|Sex)(?:\s*)?[:#](?:\s*)?(\w+)/i);
  if (genderMatch) data.gender = genderMatch[1];
  
  return data;
}
   