import { VersionDifference } from '../types';

export class VersionComparator {
  compare(content1: string, content2: string): VersionDifference[] {
    const differences: VersionDifference[] = [];
    
    // Split content into sections
    const sections1 = this.splitIntoSections(content1);
    const sections2 = this.splitIntoSections(content2);
    
    // Find all unique section names
    const allSections = new Set([...Object.keys(sections1), ...Object.keys(sections2)]);
    
    for (const section of allSections) {
      const text1 = sections1[section];
      const text2 = sections2[section];
      
      if (!text1 && text2) {
        // Section added
        differences.push({
          type: 'added',
          section: section,
          newValue: this.truncate(text2),
          significance: this.assessSignificance(section, text2),
          explanation: `New section "${section}" added to the document`
        });
      } else if (text1 && !text2) {
        // Section removed
        differences.push({
          type: 'removed',
          section: section,
          oldValue: this.truncate(text1),
          significance: this.assessSignificance(section, text1),
          explanation: `Section "${section}" removed from the document`
        });
      } else if (text1 && text2 && text1 !== text2) {
        // Section modified
        const changeType = this.detectChangeType(text1, text2);
        differences.push({
          type: 'modified',
          section: section,
          oldValue: this.truncate(text1),
          newValue: this.truncate(text2),
          significance: this.assessSignificance(section, text2, text1),
          explanation: changeType
        });
      }
    }
    
    return differences;
  }

  private splitIntoSections(content: string): { [key: string]: string } {
    const sections: { [key: string]: string } = {};
    
    // Common section headers in loan documents
    const sectionPatterns = [
      /(?:^|\n)(\d+\.\s+[A-Z][^\n]+)/g,
      /(?:^|\n)(SECTION\s+\d+[^\n]+)/gi,
      /(?:^|\n)(Article\s+[IVX]+[^\n]+)/gi
    ];
    
    let currentSection = 'Preamble';
    let currentContent = '';
    const lines = content.split('\n');
    
    for (const line of lines) {
      let isHeader = false;
      
      for (const pattern of sectionPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          // Save previous section
          if (currentContent.trim()) {
            sections[currentSection] = currentContent.trim();
          }
          
          // Start new section
          currentSection = line.trim();
          currentContent = '';
          isHeader = true;
          break;
        }
      }
      
      if (!isHeader) {
        currentContent += line + '\n';
      }
    }
    
    // Save last section
    if (currentContent.trim()) {
      sections[currentSection] = currentContent.trim();
    }
    
    return sections;
  }

  private assessSignificance(section: string, newText?: string, oldText?: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = [
      'covenant', 'default', 'event of default', 'interest rate', 
      'maturity', 'principal', 'mandatory prepayment'
    ];
    
    const highKeywords = [
      'fee', 'payment', 'collateral', 'guarantee', 'security',
      'representation', 'warranty'
    ];
    
    const mediumKeywords = [
      'notice', 'consent', 'approval', 'reporting'
    ];
    
    const text = (newText || oldText || '').toLowerCase();
    const sectionLower = section.toLowerCase();
    
    for (const keyword of criticalKeywords) {
      if (text.includes(keyword) || sectionLower.includes(keyword)) {
        return 'critical';
      }
    }
    
    for (const keyword of highKeywords) {
      if (text.includes(keyword) || sectionLower.includes(keyword)) {
        return 'high';
      }
    }
    
    for (const keyword of mediumKeywords) {
      if (text.includes(keyword) || sectionLower.includes(keyword)) {
        return 'medium';
      }
    }
    
    return 'low';
  }

  private detectChangeType(oldText: string, newText: string): string {
    if (oldText.length < newText.length * 0.5) {
      return 'Significant expansion of content in this section';
    } else if (newText.length < oldText.length * 0.5) {
      return 'Significant reduction of content in this section';
    } else {
      // Try to identify specific types of changes
      if (/\d+\.?\d*%/.test(newText) && /\d+\.?\d*%/.test(oldText)) {
        return 'Percentage value changed in this section';
      }
      if (/\$[\d,]+/.test(newText) && /\$[\d,]+/.test(oldText)) {
        return 'Dollar amount modified in this section';
      }
      return 'Content modified with similar length';
    }
  }

  private truncate(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
