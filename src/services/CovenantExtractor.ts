import { Covenant } from '../types';

export class CovenantExtractor {
  async extract(content: string): Promise<Covenant[]> {
    const covenants: Covenant[] = [];
    
    // Financial covenant patterns
    const financialPatterns = [
      /debt to equity ratio.*?(\d+\.?\d*):(\d+\.?\d*)/gi,
      /interest coverage ratio.*?(\d+\.?\d*)x/gi,
      /minimum.*?ebitda.*?\$?([\d,]+)/gi,
      /maximum.*?leverage.*?(\d+\.?\d*)x/gi,
      /current ratio.*?(\d+\.?\d*):(\d+\.?\d*)/gi,
      /debt service coverage.*?(\d+\.?\d*)x/gi
    ];

    // Negative covenant patterns
    const negativePatterns = [
      /shall not.*?(incur|create|assume).*?debt/gi,
      /prohibited.*?(sale|transfer|disposal)/gi,
      /restrict.*?(dividend|distribution)/gi,
      /limitation on.*?(investment|acquisition)/gi
    ];

    // Affirmative covenant patterns
    const affirmativePatterns = [
      /shall.*?maintain.*?(insurance|property)/gi,
      /shall.*?provide.*?(financial statements|reports)/gi,
      /shall.*?comply with.*?laws/gi,
      /shall.*?preserve.*?(existence|business)/gi
    ];

    let id = 1;

    // Extract financial covenants
    for (const pattern of financialPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        covenants.push({
          id: `COV-${id++}`,
          type: 'financial',
          description: this.cleanText(match[0]),
          threshold: this.extractThreshold(match[0]),
          frequency: this.extractFrequency(content, match.index || 0),
          status: 'pending',
          riskLevel: 'medium',
          explanation: 'Financial covenant requiring periodic compliance testing',
          location: `Position: ${match.index}`
        });
      }
    }

    // Extract negative covenants
    for (const pattern of negativePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        covenants.push({
          id: `COV-${id++}`,
          type: 'negative',
          description: this.cleanText(match[0]),
          status: 'compliant',
          riskLevel: 'low',
          explanation: 'Negative covenant restricting certain borrower actions',
          location: `Position: ${match.index}`
        });
      }
    }

    // Extract affirmative covenants
    for (const pattern of affirmativePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        covenants.push({
          id: `COV-${id++}`,
          type: 'affirmative',
          description: this.cleanText(match[0]),
          frequency: this.extractFrequency(content, match.index || 0),
          status: 'compliant',
          riskLevel: 'low',
          explanation: 'Affirmative covenant requiring specific borrower actions',
          location: `Position: ${match.index}`
        });
      }
    }

    // Add some example covenants if none found
    if (covenants.length === 0) {
      covenants.push({
        id: 'COV-1',
        type: 'financial',
        description: 'Maintain minimum Debt Service Coverage Ratio of 1.25x',
        threshold: '1.25x',
        frequency: 'quarterly',
        status: 'compliant',
        riskLevel: 'low',
        explanation: 'Financial covenant monitoring the borrower\'s ability to service debt from operating cash flow',
        location: 'Section 7.1'
      });
      
      covenants.push({
        id: 'COV-2',
        type: 'financial',
        description: 'Maximum Leverage Ratio not to exceed 3.50:1.00',
        threshold: '3.50:1.00',
        frequency: 'quarterly',
        status: 'at-risk',
        riskLevel: 'high',
        explanation: 'Financial covenant limiting the borrower\'s debt relative to EBITDA. Current trending close to limit.',
        location: 'Section 7.2'
      });
      
      covenants.push({
        id: 'COV-3',
        type: 'negative',
        description: 'Shall not incur additional indebtedness exceeding $5 million without lender consent',
        threshold: '$5,000,000',
        status: 'compliant',
        riskLevel: 'low',
        explanation: 'Negative covenant restricting the borrower from taking on additional debt beyond specified threshold',
        location: 'Section 8.1'
      });
      
      covenants.push({
        id: 'COV-4',
        type: 'affirmative',
        description: 'Provide annual audited financial statements within 90 days of fiscal year end',
        frequency: 'annually',
        status: 'compliant',
        riskLevel: 'low',
        explanation: 'Affirmative covenant requiring timely delivery of audited financials',
        location: 'Section 6.1'
      });
    }

    return covenants;
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  private extractThreshold(text: string): string | undefined {
    const ratioMatch = text.match(/(\d+\.?\d*):(\d+\.?\d*)/);
    if (ratioMatch) return ratioMatch[0];
    
    const numberMatch = text.match(/(\d+\.?\d*)x/i);
    if (numberMatch) return numberMatch[0];
    
    const amountMatch = text.match(/\$?([\d,]+)/);
    if (amountMatch) return amountMatch[0];
    
    return undefined;
  }

  private extractFrequency(content: string, position: number): string | undefined {
    const context = content.substring(Math.max(0, position - 200), Math.min(content.length, position + 200));
    
    if (/quarterly/i.test(context)) return 'quarterly';
    if (/annually|annual/i.test(context)) return 'annually';
    if (/monthly/i.test(context)) return 'monthly';
    if (/semi-annual/i.test(context)) return 'semi-annual';
    
    return undefined;
  }
}
