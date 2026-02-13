import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env, GEMINI_CONFIG } from '../config/index.js';

/**
 * Gemini AI Service
 * Wrapper for Google Gemini API interactions
 */
class GeminiService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    this.model = this.client.getGenerativeModel({
      model: GEMINI_CONFIG.MODEL_NAME,
    });
  }

  /**
   * Generate structured JSON response from text prompt
   */
  async generateJSON<T>(prompt: string, schema: object): Promise<T> {
    try {
      const model = this.client.getGenerativeModel({
        model: GEMINI_CONFIG.MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Gemini generateJSON error:', error);
      throw new Error('Failed to generate structured response from Gemini');
    }
  }

  /**
   * Generate text response from prompt
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini generateText error:', error);
      throw new Error('Failed to generate text response from Gemini');
    }
  }

  /**
   * Extract transaction details from receipt photo
   * Uses vision capability
   */
  async extractFromPhoto(imageBase64: string, mimeType: string): Promise<object> {
    try {
      const model = this.client.getGenerativeModel({
        model: GEMINI_CONFIG.MODEL_NAME,
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
        'Extract transaction details from this receipt image. ' +
          'Return JSON with: date, amount, vendor, currency. ' +
          'If any field is unclear, use null.',
      ]);

      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini extractFromPhoto error:', error);
      throw new Error('Failed to extract data from photo');
    }
  }

  /**
   * Extract transaction details from PDF invoice
   * Native PDF support
   */
  async extractFromPDF(pdfBase64: string): Promise<object> {
    try {
      const model = this.client.getGenerativeModel({
        model: GEMINI_CONFIG.MODEL_NAME,
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: pdfBase64,
            mimeType: 'application/pdf',
          },
        },
        'Extract transaction details from this PDF invoice. ' +
          'Return JSON with: date, amount, vendor, currency. ' +
          'If any field is unclear, use null.',
      ]);

      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini extractFromPDF error:', error);
      throw new Error('Failed to extract data from PDF');
    }
  }

  /**
   * Health check - verify API key is valid
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.generateText('Hello');
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
