import { RiskAnalysis, RiskFactor, Covenant, ReportingObligation, VersionDifference } from '../types';

export interface LoanRiskData {
  covenants?: Covenant[];
  reportingObligations?: ReportingObligation[];
  differences?: VersionDifference[];
}

export class RiskAnalyzer {
  analyze(loanData: LoanRiskData): RiskAnalysis {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;
    
    // Analyze covenant compliance
    if (loanData.covenants && Array.isArray(loanData.covenants)) {
      const covenantRisk = this.analyzeCovenants(loanData.covenants);
      riskFactors.push(...covenantRisk.factors);
      totalRiskScore += covenantRisk.score;
    }
    
    // Analyze reporting obligations
    if (loanData.reportingObligations) {
      const reportingRisk = this.analyzeReporting(loanData.reportingObligations);
      riskFactors.push(...reportingRisk.factors);
      totalRiskScore += reportingRisk.score;
    }
    
    // Analyze document inconsistencies
    if (loanData.differences) {
      const inconsistencyRisk = this.analyzeInconsistencies(loanData.differences);
      riskFactors.push(...inconsistencyRisk.factors);
      totalRiskScore += inconsistencyRisk.score;
    }
    
    // Calculate average risk score
    const avgRiskScore = riskFactors.length > 0 ? totalRiskScore / riskFactors.length : 0;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors);
    
    return {
      overallRisk: this.determineOverallRisk(avgRiskScore),
      riskScore: Math.round(avgRiskScore),
      riskFactors,
      recommendations
    };
  }

  private analyzeCovenants(covenants: Covenant[]): { factors: RiskFactor[], score: number } {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    
    const breached = covenants.filter(c => c.status === 'breached');
    const atRisk = covenants.filter(c => c.status === 'at-risk');
    
    if (breached.length > 0) {
      factors.push({
        category: 'Covenant Breach',
        description: `${breached.length} covenant(s) currently breached`,
        severity: 'critical',
        impact: 'Immediate action required. May trigger default provisions and acceleration of loan.'
      });
      totalScore += 90;
    }
    
    if (atRisk.length > 0) {
      factors.push({
        category: 'Covenant At Risk',
        description: `${atRisk.length} covenant(s) approaching breach threshold`,
        severity: 'high',
        impact: 'Requires close monitoring and potentially proactive measures to maintain compliance.'
      });
      totalScore += 70;
    }
    
    const highRiskCovenants = covenants.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical');
    if (highRiskCovenants.length > 0) {
      factors.push({
        category: 'High Risk Covenants',
        description: `${highRiskCovenants.length} covenant(s) classified as high risk`,
        severity: 'medium',
        impact: 'Enhanced monitoring recommended for these covenants.'
      });
      totalScore += 50;
    }
    
    return { factors, score: factors.length > 0 ? totalScore / factors.length : 0 };
  }

  private analyzeReporting(obligations: ReportingObligation[]): { factors: RiskFactor[], score: number } {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    
    const overdue = obligations.filter((o) => o.status === 'overdue');
    const dueSoon = obligations.filter((o) => o.status === 'due-soon');
    
    if (overdue.length > 0) {
      factors.push({
        category: 'Overdue Reports',
        description: `${overdue.length} reporting obligation(s) overdue`,
        severity: 'high',
        impact: 'May constitute a technical default. Immediate submission required.'
      });
      totalScore += 75;
    }
    
    if (dueSoon.length > 0) {
      factors.push({
        category: 'Upcoming Reports',
        description: `${dueSoon.length} reporting obligation(s) due soon`,
        severity: 'medium',
        impact: 'Timely preparation and submission required to maintain compliance.'
      });
      totalScore += 40;
    }
    
    return { factors, score: factors.length > 0 ? totalScore / factors.length : 0 };
  }

  private analyzeInconsistencies(differences: VersionDifference[]): { factors: RiskFactor[], score: number } {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    
    const critical = differences.filter((d) => d.significance === 'critical');
    const high = differences.filter((d) => d.significance === 'high');
    
    if (critical.length > 0) {
      factors.push({
        category: 'Critical Document Changes',
        description: `${critical.length} critical difference(s) detected between document versions`,
        severity: 'critical',
        impact: 'Material changes to loan terms requiring immediate review and potential renegotiation.'
      });
      totalScore += 85;
    }
    
    if (high.length > 0) {
      factors.push({
        category: 'Significant Document Changes',
        description: `${high.length} significant difference(s) detected between document versions`,
        severity: 'high',
        impact: 'Important changes requiring review to ensure all parties are aligned.'
      });
      totalScore += 65;
    }
    
    return { factors, score: factors.length > 0 ? totalScore / factors.length : 0 };
  }

  private determineOverallRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    const hasCritical = riskFactors.some(f => f.severity === 'critical');
    const hasHigh = riskFactors.some(f => f.severity === 'high');
    
    if (hasCritical) {
      recommendations.push('Schedule immediate meeting with all stakeholders to address critical issues');
      recommendations.push('Engage legal counsel to review potential default scenarios and remediation options');
    }
    
    if (hasHigh) {
      recommendations.push('Increase monitoring frequency for high-risk items');
      recommendations.push('Prepare corrective action plans for at-risk covenants');
    }
    
    if (riskFactors.some(f => f.category.includes('Report'))) {
      recommendations.push('Implement automated reminders for upcoming reporting deadlines');
      recommendations.push('Review internal processes for timely report preparation');
    }
    
    if (riskFactors.some(f => f.category.includes('Document'))) {
      recommendations.push('Conduct thorough review of all document changes with legal team');
      recommendations.push('Ensure all parties have acknowledged and agreed to modifications');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain current monitoring practices');
      recommendations.push('Continue regular compliance reviews');
      recommendations.push('Keep all documentation up to date');
    }
    
    return recommendations;
  }
}
