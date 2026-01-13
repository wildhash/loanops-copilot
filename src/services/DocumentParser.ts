import * as fs from 'fs';
import * as path from 'path';

export class DocumentParser {
  async parse(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return this.parsePDF(filePath);
      case '.doc':
      case '.docx':
        return this.parseWord(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParser = require('pdf-parse');
      const data = await pdfParser(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Error parsing PDF: ${(error as Error).message}`);
    }
  }

  private async parseWord(filePath: string): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`Error parsing Word document: ${(error as Error).message}`);
    }
  }
}
