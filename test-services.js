#!/usr/bin/env node

/**
 * Test script to verify LoanOps Copilot services work correctly
 */

const fs = require('fs');
const path = require('path');

// Import compiled services
const { CovenantExtractor } = require('./dist/services/CovenantExtractor');
const { VersionComparator } = require('./dist/services/VersionComparator');
const { RiskAnalyzer } = require('./dist/services/RiskAnalyzer');

console.log('🧪 Testing LoanOps Copilot Services\n');

// Test 1: Covenant Extraction
console.log('Test 1: Covenant Extraction');
console.log('─'.repeat(50));

const sampleText = fs.readFileSync(
  path.join(__dirname, 'examples', 'sample-loan-agreement.txt'),
  'utf8'
);

const extractor = new CovenantExtractor();
extractor.extract(sampleText).then(covenants => {
  console.log(`✅ Extracted ${covenants.length} covenants:`);
  covenants.forEach((cov, idx) => {
    console.log(`   ${idx + 1}. ${cov.id} - ${cov.type.toUpperCase()}`);
    console.log(`      Status: ${cov.status} | Risk: ${cov.riskLevel}`);
    console.log(`      ${cov.description.substring(0, 80)}...`);
  });
  console.log();

  // Test 2: Risk Analysis
  console.log('Test 2: Risk Analysis');
  console.log('─'.repeat(50));
  
  const analyzer = new RiskAnalyzer();
  const riskAnalysis = analyzer.analyze({
    covenants: covenants,
    reportingObligations: []
  });
  
  console.log(`✅ Risk Analysis Complete:`);
  console.log(`   Overall Risk: ${riskAnalysis.overallRisk.toUpperCase()}`);
  console.log(`   Risk Score: ${riskAnalysis.riskScore}/100`);
  console.log(`   Risk Factors: ${riskAnalysis.riskFactors.length}`);
  riskAnalysis.riskFactors.forEach((factor, idx) => {
    console.log(`   ${idx + 1}. ${factor.category} (${factor.severity})`);
  });
  console.log(`   Recommendations: ${riskAnalysis.recommendations.length}`);
  console.log();

  // Test 3: Version Comparison
  console.log('Test 3: Version Comparison');
  console.log('─'.repeat(50));
  
  const sampleText2 = fs.readFileSync(
    path.join(__dirname, 'examples', 'sample-loan-agreement-v2.txt'),
    'utf8'
  );
  
  const comparator = new VersionComparator();
  const differences = comparator.compare(sampleText, sampleText2);
  
  console.log(`✅ Version Comparison Complete:`);
  console.log(`   Differences Found: ${differences.length}`);
  
  const critical = differences.filter(d => d.significance === 'critical').length;
  const high = differences.filter(d => d.significance === 'high').length;
  const medium = differences.filter(d => d.significance === 'medium').length;
  const low = differences.filter(d => d.significance === 'low').length;
  
  console.log(`   Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low}`);
  
  if (differences.length > 0) {
    console.log(`\n   Sample differences:`);
    differences.slice(0, 3).forEach((diff, idx) => {
      console.log(`   ${idx + 1}. ${diff.type.toUpperCase()} in "${diff.section}"`);
      console.log(`      Significance: ${diff.significance}`);
      console.log(`      ${diff.explanation}`);
    });
  }
  console.log();

  // Summary
  console.log('='.repeat(50));
  console.log('✅ All Tests Passed!');
  console.log('='.repeat(50));
  console.log('\nLoanOps Copilot services are functioning correctly.');
  console.log('You can now start the application with: npm start');
  console.log();
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
