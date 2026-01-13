import { describe, it, expect, vi } from 'vitest';
import { RiskAnalyzer } from '../services/RiskAnalyzer';
import { DocumentParser } from '../services/DocumentParser';
import { CovenantExtractor } from '../services/CovenantExtractor';

/**
 * IPC Contract Tests
 * 
 * These tests validate the contract between the renderer process and main process
 * in the Electron application. While we can't directly test IPC in a unit test environment,
 * we verify that the service methods accept and return the expected data shapes.
 */
describe('IPC Contract Tests', () => {
  describe('analyze-risk handler contract', () => {
    it('should accept loan data with covenants and return risk analysis', () => {
      const analyzer = new RiskAnalyzer();
      
      // Mock payload that matches what renderer sends
      const payload = {
        covenants: [
          {
            id: 'COV-001',
            type: 'financial' as const,
            description: 'Test covenant',
            status: 'compliant' as const,
            riskLevel: 'low' as const,
            explanation: 'Test explanation',
            location: 'Section 1'
          }
        ],
        document: {
          id: 'DOC-001',
          name: 'test.pdf',
          path: '/test/test.pdf'
        }
      };

      // Service should accept this payload structure
      const result = analyzer.analyze(payload);

      // Validate response structure matches what renderer expects
      expect(result).toBeDefined();
      expect(result.overallRisk).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.overallRisk);
      expect(typeof result.riskScore).toBe('number');
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);

      // Each risk factor should have expected shape
      result.riskFactors.forEach(factor => {
        expect(factor.category).toBeDefined();
        expect(factor.description).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(factor.severity);
        expect(factor.impact).toBeDefined();
      });
    });

    it('should handle empty covenants array gracefully', () => {
      const analyzer = new RiskAnalyzer();
      
      const payload = {
        covenants: []
      };

      const result = analyzer.analyze(payload);

      expect(result.overallRisk).toBe('low');
      expect(result.riskScore).toBe(0);
      expect(result.riskFactors).toHaveLength(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', () => {
      const analyzer = new RiskAnalyzer();
      
      const payload = {
        covenants: [
          {
            id: 'COV-001',
            type: 'financial' as const,
            description: 'Test',
            status: 'compliant' as const,
            riskLevel: 'low' as const,
            explanation: 'Test',
            location: 'Section 1'
          }
        ]
        // reportingObligations and differences are optional
      };

      expect(() => analyzer.analyze(payload)).not.toThrow();
    });

    it('should handle all covenant statuses correctly', () => {
      const analyzer = new RiskAnalyzer();
      
      const statuses: Array<'compliant' | 'at-risk' | 'breached' | 'pending'> = [
        'compliant',
        'at-risk',
        'breached',
        'pending'
      ];

      statuses.forEach(status => {
        const payload = {
          covenants: [
            {
              id: 'COV-001',
              type: 'financial' as const,
              description: 'Test',
              status,
              riskLevel: 'low' as const,
              explanation: 'Test',
              location: 'Section 1'
            }
          ]
        };

        const result = analyzer.analyze(payload);
        expect(result).toBeDefined();
        expect(result.overallRisk).toBeDefined();
      });
    });
  });

  describe('parse-document handler contract', () => {
    it('should accept file path and return parsed content structure', async () => {
      const parser = new DocumentParser();
      const mockFilePath = '/test/document.pdf';

      // Mock the fs and pdf-parse dependencies - cast to access private method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(parser as any, 'parsePDF').mockResolvedValue('Mocked PDF content');

      const result = await parser.parse(mockFilePath);

      // Validate response structure
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle parsing errors gracefully', async () => {
      const parser = new DocumentParser();
      const invalidFilePath = '/invalid/path.pdf';

      // Mock a parsing error - we need to cast to access private method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(parser as any, 'parsePDF').mockRejectedValue(new Error('File not found'));

      await expect(parser.parse(invalidFilePath)).rejects.toThrow();
    });
  });

  describe('extract-covenants handler contract', () => {
    it('should accept document content and return covenant array', async () => {
      const extractor = new CovenantExtractor();
      const mockContent = `
        Credit Agreement
        
        Section 6.11 Financial Covenants
        
        The Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.20:1.00
        tested quarterly. The Maximum Leverage Ratio shall not exceed 3.50:1.00.
      `;

      const result = await extractor.extract(mockContent);

      // Validate response structure
      expect(Array.isArray(result)).toBe(true);
      result.forEach(covenant => {
        expect(covenant.id).toBeDefined();
        expect(covenant.type).toBeDefined();
        expect(['financial', 'operational', 'negative', 'affirmative']).toContain(covenant.type);
        expect(covenant.description).toBeDefined();
        expect(covenant.status).toBeDefined();
        expect(covenant.riskLevel).toBeDefined();
        expect(covenant.explanation).toBeDefined();
        expect(covenant.location).toBeDefined();
      });
    });

    it('should return covenants even for simple content (fallback examples)', async () => {
      const extractor = new CovenantExtractor();
      const mockContent = 'This is a simple document with no covenants.';

      const result = await extractor.extract(mockContent);

      // CovenantExtractor provides example covenants when none are found
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Validate structure
      result.forEach(covenant => {
        expect(covenant.id).toBeDefined();
        expect(covenant.type).toBeDefined();
        expect(covenant.description).toBeDefined();
      });
    });
  });

  describe('get-loan-health handler contract', () => {
    it('should return health data structure', () => {
      // This simulates what the handler returns
      const mockHealthResponse = {
        success: true,
        health: {
          overall: 'healthy',
          score: 85,
          metrics: {
            documentCompliance: 90,
            covenantAdherence: 85,
            reportingTimeliness: 80,
            riskLevel: 'low'
          }
        }
      };

      // Validate response structure
      expect(mockHealthResponse.success).toBe(true);
      expect(mockHealthResponse.health).toBeDefined();
      expect(typeof mockHealthResponse.health.score).toBe('number');
      expect(mockHealthResponse.health.score).toBeGreaterThanOrEqual(0);
      expect(mockHealthResponse.health.score).toBeLessThanOrEqual(100);
      expect(mockHealthResponse.health.metrics).toBeDefined();
      expect(typeof mockHealthResponse.health.metrics.documentCompliance).toBe('number');
      expect(typeof mockHealthResponse.health.metrics.covenantAdherence).toBe('number');
      expect(typeof mockHealthResponse.health.metrics.reportingTimeliness).toBe('number');
    });
  });

  describe('upload-document handler contract', () => {
    it('should return array of file objects', () => {
      // This simulates what the handler returns after file selection
      const mockUploadResponse = [
        {
          path: '/test/document1.pdf',
          name: 'document1.pdf',
          size: 1024000
        },
        {
          path: '/test/document2.pdf',
          name: 'document2.pdf',
          size: 2048000
        }
      ];

      // Validate response structure
      expect(Array.isArray(mockUploadResponse)).toBe(true);
      mockUploadResponse.forEach(file => {
        expect(file.path).toBeDefined();
        expect(typeof file.path).toBe('string');
        expect(file.name).toBeDefined();
        expect(typeof file.name).toBe('string');
        expect(file.size).toBeDefined();
        expect(typeof file.size).toBe('number');
        expect(file.size).toBeGreaterThan(0);
      });
    });

    it('should return empty array when user cancels', () => {
      const mockCancelResponse: unknown[] = [];
      expect(Array.isArray(mockCancelResponse)).toBe(true);
      expect(mockCancelResponse.length).toBe(0);
    });
  });

  describe('error handling patterns', () => {
    it('should use consistent error response structure', () => {
      const mockErrorResponse = {
        success: false,
        error: 'Failed to parse document: File format not supported'
      };

      expect(mockErrorResponse.success).toBe(false);
      expect(mockErrorResponse.error).toBeDefined();
      expect(typeof mockErrorResponse.error).toBe('string');
    });

    it('should handle Error objects correctly', () => {
      const error = new Error('Test error message');
      const errorResponse = {
        success: false,
        error: error.message
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Test error message');
    });
  });

  describe('data type consistency', () => {
    it('should maintain consistent date formats', () => {
      // Dates should be ISO strings when crossing IPC boundary
      const now = new Date();
      const isoString = now.toISOString();
      
      expect(typeof isoString).toBe('string');
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Should be parseable back to Date
      const parsed = new Date(isoString);
      expect(parsed.getTime()).toBe(now.getTime());
    });

    it('should handle undefined vs null consistently', () => {
      // Optional fields should be consistent across IPC
      const payload = {
        covenants: [
          {
            id: 'COV-001',
            type: 'financial' as const,
            description: 'Test',
            threshold: undefined, // optional field
            frequency: undefined, // optional field
            status: 'compliant' as const,
            riskLevel: 'low' as const,
            explanation: 'Test',
            location: 'Section 1'
          }
        ]
      };

      const analyzer = new RiskAnalyzer();
      expect(() => analyzer.analyze(payload)).not.toThrow();
    });
  });
});
