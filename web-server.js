const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Mock electron's ipcRenderer for web mode
const mockIpcScript = `
<script>
  // Mock ipcRenderer for web development mode
  window.require = function(module) {
    if (module === 'electron') {
      return {
        ipcRenderer: {
          invoke: async function(channel, ...args) {
            console.log('IPC invoke:', channel, args);
            const response = await fetch('/api/' + channel, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            });
            return response.json();
          },
          on: function(channel, callback) {
            console.log('IPC on:', channel);
          },
          send: function(channel, ...args) {
            console.log('IPC send:', channel, args);
          }
        }
      };
    }
    throw new Error('Module not found: ' + module);
  };
</script>
`;

// Web-compatible renderer wrapper
const rendererWrapper = `
// Web-compatible wrapper for renderer.js
const React = window.React;
const { useState, useEffect } = React;
const { createRoot } = window.ReactDOM;
`;

const server = http.createServer(async (req, res) => {
  console.log('Request:', req.method, req.url);

  // Handle API requests (mock IPC)
  if (req.url.startsWith('/api/')) {
    const channel = req.url.replace('/api/', '');
    let body = '';
    
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const args = body ? JSON.parse(body) : [];
        const result = await handleIpc(channel, args);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'dist', filePath);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found: ' + req.url);
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      // Inject mock IPC script into HTML
      if (ext === '.html') {
        content = content.toString().replace('<head>', '<head>' + mockIpcScript);
      }
      
      // Transform renderer.js to be web-compatible
      if (req.url === '/renderer.js') {
        let jsContent = content.toString();
        // Remove ES module imports and use globals
        jsContent = jsContent
          .replace(/import React,?\s*\{[^}]*\}\s*from\s*['"]react['"];?/g, 
                   'const { useState, useEffect, useCallback, useMemo, useRef } = React;')
          .replace(/import\s*\{\s*createRoot\s*\}\s*from\s*['"]react-dom\/client['"];?/g, 
                   'const { createRoot } = ReactDOM;')
          .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '// import removed for web')
          .replace(/export\s+/g, '');
        content = jsContent;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Load demo data
const demoDataPath = path.join(__dirname, 'demo-data');
let demoData = {};

try {
  demoData = {
    loan: JSON.parse(fs.readFileSync(path.join(demoDataPath, 'loan_demo.json'), 'utf8')),
    covenants: JSON.parse(fs.readFileSync(path.join(demoDataPath, 'covenants.json'), 'utf8')),
    issues: JSON.parse(fs.readFileSync(path.join(demoDataPath, 'issues_seed.json'), 'utf8')),
    obligations: JSON.parse(fs.readFileSync(path.join(demoDataPath, 'obligations.json'), 'utf8')),
    auditLog: JSON.parse(fs.readFileSync(path.join(demoDataPath, 'audit_log.json'), 'utf8'))
  };
  console.log('Demo data loaded successfully');
} catch (err) {
  console.error('Error loading demo data:', err.message);
}

// Handle IPC-like API calls
async function handleIpc(channel, args) {
  console.log('Handling IPC:', channel, args);
  
  switch (channel) {
    case 'load-demo-data':
      return {
        success: true,
        data: {
          loan: demoData.loan,
          covenants: demoData.covenants,
          issues: demoData.issues,
          obligations: demoData.obligations,
          auditLog: demoData.auditLog,
          healthScore: {
            score: 72,
            status: 'warning',
            trend: 'stable'
          }
        }
      };
    
    case 'get-loan-health':
      return {
        success: true,
        health: {
          loanId: 'LOAN-001',
          overallHealth: 'warning',
          healthScore: 72,
          metrics: {
            documentCompliance: 90,
            covenantAdherence: 85,
            reportingTimeliness: 80,
            riskLevel: 'medium'
          },
          alerts: [
            { type: 'warning', message: 'Debt coverage ratio approaching limit' },
            { type: 'info', message: 'Quarterly report due in 15 days' }
          ],
          lastUpdated: new Date().toISOString()
        }
      };
    
    case 'analyze-risk':
      return {
        success: true,
        analysis: {
          score: 72,
          level: 'Medium',
          factors: [
            { name: 'Covenant Compliance', score: 85, weight: 0.3 },
            { name: 'Payment History', score: 90, weight: 0.25 },
            { name: 'Financial Ratios', score: 65, weight: 0.25 },
            { name: 'Market Conditions', score: 50, weight: 0.2 }
          ],
          recommendations: [
            'Monitor debt-to-equity ratio closely',
            'Review upcoming covenant deadlines',
            'Consider early communication with borrower'
          ]
        }
      };

    case 'get-covenants':
      return { success: true, covenants: demoData.covenants || [] };

    case 'get-issues':
      return { success: true, issues: demoData.issues || [] };

    case 'get-obligations':
      return { success: true, obligations: demoData.obligations || [] };

    case 'get-audit-log':
      return { success: true, auditLog: demoData.auditLog || [] };

    default:
      console.log('Unknown channel:', channel);
      return { success: false, error: 'Unknown channel: ' + channel };
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('  LoanOps Copilot - Web Development Server');
  console.log('='.repeat(60));
  console.log('');
  console.log('  Server running at: http://localhost:' + PORT);
  console.log('');
  console.log('  Open in VS Code Simple Browser or your browser');
  console.log('='.repeat(60));
  console.log('');
});
