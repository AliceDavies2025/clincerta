/**
 * Document Processing Service
 * Handles advanced document processing, text extraction, and analysis
 */

import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';
import { exec as execCallback } from 'child_process';
const exec = util.promisify(execCallback);

// Document processing libraries
import pdfParse from 'pdf-parse';
import * as docx from 'docx';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';

export interface ProcessedDocument {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
    pageCount?: number;
    wordCount?: number;
    isScanned?: boolean;
    ocrApplied?: boolean;
    processingTime?: number;
  };
}

/**
 * Process a document file and extract its text content
 */
export async function processDocument(filePath: string): Promise<ProcessedDocument> {
  const startTime = Date.now();
  const ext = path.extname(filePath).toLowerCase();
  
  let text = '';
  let metadata: ProcessedDocument['metadata'] = {};
  let isScanned = false;
  let ocrApplied = false;
  
  try {
    if (ext === '.pdf') {
      // Process PDF document
      const { text: pdfText, metadata: pdfMetadata, isScanned: isPdfScanned } = await processPdf(filePath);
      text = pdfText;
      metadata = pdfMetadata;
      isScanned = isPdfScanned;
      
      // If detected as scanned, apply OCR
      if (isScanned) {
        const ocrText = await applyOcrToPdf(filePath);
        if (ocrText && ocrText.length > text.length) {
          text = ocrText;
          ocrApplied = true;
        }
      }
    } else if (ext === '.docx') {
      // Process DOCX document
      text = await processDocx(filePath);
      metadata.title = path.basename(filePath, ext);
    } else if (ext === '.doc') {
      // Process legacy DOC format
      text = await processDoc(filePath);
      metadata.title = path.basename(filePath, ext);
    } else if (ext === '.txt') {
      // Process plain text
      text = await fs.readFile(filePath, 'utf-8');
      metadata.title = path.basename(filePath, ext);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
    
    // Calculate word count
    metadata.wordCount = text.split(/\s+/).filter(Boolean).length;
    
    // Add processing metadata
    metadata.processingTime = Date.now() - startTime;
    metadata.isScanned = isScanned;
    metadata.ocrApplied = ocrApplied;
    
    return {
      text,
      metadata
    };
  } catch (error: any) {
    console.error('Document processing error:', error);
    throw new Error(`Failed to process document: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Process PDF documents and extract text
 */
async function processPdf(filePath: string): Promise<{
  text: string;
  metadata: ProcessedDocument['metadata'];
  isScanned: boolean;
}> {
  // Read the PDF file
  const dataBuffer = await fs.readFile(filePath);
  
  try {
    // Parse PDF
    const pdf = await pdfParse(dataBuffer);
    
    const metadata: ProcessedDocument['metadata'] = {
      title: pdf.info?.Title || path.basename(filePath, '.pdf'),
      author: pdf.info?.Author,
      creationDate: pdf.info?.CreationDate,
      pageCount: pdf.numpages,
    };
    
    // Check if this might be a scanned document (very little text per page)
    const textPerPage = pdf.text.length / pdf.numpages;
    const isScanned = textPerPage < 100; // Arbitrary threshold for detecting scanned docs
    
    return {
      text: pdf.text,
      metadata,
      isScanned
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      text: '',
      metadata: { title: path.basename(filePath, '.pdf') },
      isScanned: true // Assume it's scanned if we can't extract text properly
    };
  }
}

/**
 * Apply OCR to extract text from scanned PDF documents
 */
async function applyOcrToPdf(filePath: string): Promise<string> {
  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-ocr-'));
    
    // Convert PDF to images
    const convert = fromPath(filePath, {
      density: 300,
      saveFilename: "page",
      savePath: tempDir,
      format: "png",
      width: 2480,
      height: 3508 // A4 size at 300 DPI
    });
    
    // Get number of pages in PDF
    const dataBuffer = await fs.readFile(filePath);
    const pdf = await pdfParse(dataBuffer);
    const pageCount = pdf.numpages;
    
    // Convert PDF pages to images
    for (let i = 1; i <= pageCount; i++) {
      await convert(i);
    }
    
    // Process images with OCR
    const worker = await createWorker('eng');
    let fullText = '';
    
    // Process each image
    for (let i = 1; i <= pageCount; i++) {
      const imagePath = path.join(tempDir, `page${i}.png`);
      
      // Optimize image for OCR
      await sharp(imagePath)
        .greyscale()
        .normalize()
        .sharpen()
        .toFile(path.join(tempDir, `page${i}-processed.png`));
      
      const { data: { text } } = await worker.recognize(path.join(tempDir, `page${i}-processed.png`));
      fullText += text + '\n\n';
    }
    
    // Clean up
    await worker.terminate();
    await fs.rm(tempDir, { recursive: true, force: true });
    
    return fullText;
  } catch (error) {
    console.error('OCR processing error:', error);
    return '';
  }
}

/**
 * Process DOCX documents
 */
async function processDocx(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: content });
    return result.value;
  } catch (error) {
    console.error('DOCX processing error:', error);
    return '';
  }
}

/**
 * Process legacy DOC documents (using external conversion)
 */
async function processDoc(filePath: string): Promise<string> {
  try {
    // Check if pandoc is available (requires node-pandoc package and pandoc installed)
    try {
      await exec('pandoc --version');
      
      const tempFile = path.join(os.tmpdir(), `${Date.now()}.txt`);
      await exec(`pandoc -f doc -t plain "${filePath}" -o "${tempFile}"`);
      
      const text = await fs.readFile(tempFile, 'utf-8');
      await fs.unlink(tempFile);
      
      return text;
    } catch (pandocError) {
      // Fallback: Try to read as text
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    }
  } catch (error) {
    console.error('DOC processing error:', error);
    return '';
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
