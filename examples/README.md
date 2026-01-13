# Example Loan Documents

This directory contains sample loan documents for testing LoanOps Copilot features.

## Sample Documents

### sample-loan-agreement.txt
A simplified text representation of a syndicated loan agreement containing:
- Financial covenants (leverage ratio, debt service coverage ratio)
- Negative covenants (restrictions on additional debt)
- Affirmative covenants (financial reporting requirements)
- Key loan terms and conditions

### sample-loan-agreement-v2.txt
An amended version of the sample loan agreement with:
- Modified leverage ratio covenant
- Changed reporting frequency
- Additional negative covenant
- Updated interest rate terms

## Usage

These sample files are plain text for easy testing. In production use:

1. Upload real PDF or Word loan documents
2. The application will extract covenants and key terms
3. Compare different versions to detect changes
4. Monitor covenant compliance and risk factors

## Creating Your Own Test Documents

You can create additional test documents that include common loan provisions:

- **Financial Covenants**: "maintain minimum debt service coverage ratio of 1.25x"
- **Leverage Limits**: "maximum leverage ratio not to exceed 3.50:1.00"
- **Debt Restrictions**: "shall not incur additional indebtedness exceeding $5 million"
- **Reporting Requirements**: "provide annual audited financial statements within 90 days"
- **Negative Covenants**: "shall not create, incur, assume, or permit any liens"
- **Affirmative Covenants**: "shall maintain insurance coverage", "shall comply with all laws"

The covenant extraction engine will identify these patterns and extract them for monitoring.
