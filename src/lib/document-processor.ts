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
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

// Convert callback-based functions to Promise-based
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exec = promisify(execCallback);

// Create a polyfill for DOMMatrix which is not available in Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    
    constructor(init?: string | number[]) {
      // Basic implementation
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; 
        this.c = init[2]; this.d = init[3]; 
        this.e = init[4]; this.f = init[5];
      }
    }
    
    // Add minimal methods needed
    translate() { return this; }
    scale() { return this; }
    multiply() { return this; }
    inverse() { return this; }
  } as any;
}

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
      pageCount: 0,
      fileType: fileExt.replace('.', ''),
      fileSize
    };

    let text = '';

    if (fileExt === '.pdf') {
      try {
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
          
          // In server environment, we'll just note that OCR would be needed
          // but won't attempt to run it as it's problematic in serverless
          metadata.ocrApplied = false;
          text = 'This appears to be a scanned document that requires OCR processing.';
        } else {
          text = pdfText;
        }
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        text = 'Error processing PDF document';
      }
    } else if (fileExt === '.docx') {
      // Process DOCX
      try {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (docxError) {
        console.error('DOCX processing error:', docxError);
        text = 'Error processing DOCX document';
      }
    } else if (fileExt === '.doc' || fileExt === '.txt') {
      // Process TXT or legacy DOC as plain text
      try {
        text = fs.readFileSync(filePath, 'utf8');
      } catch (txtError) {
        console.error('Text file processing error:', txtError);
        text = 'Error processing text document';
      }
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
 * Calculate similarity score between two texts
 * This is a simple implementation - production would use more sophisticated algorithms
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  // Simple Jaccard similarity for demo purposes
  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(Boolean));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(Boolean));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
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
   