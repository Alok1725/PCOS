import express from 'express';
import { upload, supabase } from '../utils/db.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import tesseract from 'tesseract.js';
import { getVisionCompletion } from '../services/aiProvider.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Analyze USG images with Vision AI (Groq Scout 4 with Gemini fallback)
async function analyzeImageWithVision(imageBuffer, mimeType) {
  console.log('[Vision] Analyzing USG image with Vision AI...');
  
  const base64Image = imageBuffer.toString('base64');

  try {
    const prompt = `You are a radiology assistant. Analyze this ultrasound (USG) image for PCOS indicators. Describe in detail:
1. Ovarian morphology (size, shape, volume if visible)
2. Number of follicles visible and their sizes
3. Any "string of pearls" or peripheral follicle arrangement
4. Echogenicity of the ovarian stroma
5. Any other relevant findings

If this does not appear to be an ultrasound image, describe what you see.
Provide your findings as a structured medical report text.`;

    const completion = await getVisionCompletion({
      prompt,
      imageBase64: base64Image,
      mimeType: mimeType || 'image/jpeg',
      temperature: 0.3,
      maxTokens: 1024,
      jsonMode: false,
    });

    const text = completion.text || '';
    console.log(`[Vision] Analysis complete (${completion.provider}/${completion.model}): ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('[Vision] Error:', error.message);
    // Fallback to regular OCR text if vision fails
    return '[Vision analysis unavailable - ' + error.message + ']';
  }
}

router.post('/report', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!reportType) {
      return res.status(400).json({ error: 'Missing reportType' });
    }

    console.log(`[Upload] Processing ${reportType} file: ${file.originalname} (${file.mimetype}, ${file.size} bytes) for user ${userId}`);

    // 1. Upload file to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${reportType}/${fileName}`;
    let fileUrl = '';

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error('[Upload] Storage upload error:', uploadError.message);
        fileUrl = `storage-upload-failed://${filePath}`;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('reports')
          .getPublicUrl(filePath);
        fileUrl = publicUrlData.publicUrl;
        console.log('[Upload] File stored at:', fileUrl);
      }
    } catch (storageErr) {
      console.error('[Upload] Storage connection error:', storageErr.message);
      fileUrl = `storage-unavailable://${filePath}`;
    }

    // 2. Extract text / Analyze image
    let extractedText = '';
    try {
      if (file.mimetype === 'application/pdf') {
        // PDF: extract text directly
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
        console.log(`[Upload] PDF text extracted: ${extractedText.length} characters`);
      } else if (file.mimetype.startsWith('image/') && reportType === 'ultrasound') {
        // USG IMAGE: Use AI Vision to interpret the scan
        console.log('[Upload] USG image detected - using AI Vision instead of OCR');
        extractedText = await analyzeImageWithVision(file.buffer, file.mimetype);
      } else if (file.mimetype.startsWith('image/')) {
        // Other images (blood reports): Use Tesseract OCR for text extraction
        console.log('[Upload] Running Tesseract OCR on image...');
        const tesseractResult = await tesseract.recognize(file.buffer, 'eng');
        extractedText = tesseractResult.data.text;
        console.log(`[Upload] Image OCR extracted ${extractedText.length} characters`);
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
    } catch (ocrError) {
      console.error('[Upload] Extraction Error:', ocrError.message);
      extractedText = '[Extraction failed - manual review needed]';
    }

    // 3. Save to database
    console.log('[Upload] Saving report to database...');
    const { data: reportRecord, error: dbError } = await supabase
      .from('reports')
      .insert([
        {
          user_id: userId,
          report_type: reportType,
          file_url: fileUrl,
          ocr_extracted_text: extractedText,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('[Upload] Database insert error:', dbError.message, dbError.details);
      return res.status(500).json({ error: `Failed to save report: ${dbError.message}` });
    }

    console.log(`[Upload] Report saved with id: ${reportRecord.id}`);
    res.status(200).json({
      reportId: reportRecord.id,
      fileUrl,
      extractedText,
    });

  } catch (err) {
    console.error('[Upload] Unhandled error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

export default router;
