import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentParser } from './services/DocumentParser';
import { CovenantExtractor } from './services/CovenantExtractor';
import { VersionComparator } from './services/VersionComparator';
import { RiskAnalyzer, LoanRiskData } from './services/RiskAnalyzer';
import { DemoDataLoader } from './demo/DemoDataLoader';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'LoanOps Copilot',
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('upload-document', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'Word Documents', extensions: ['doc', 'docx'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const files = result.filePaths.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      size: fs.statSync(filePath).size
    }));
    return files;
  }
  return [];
});

ipcMain.handle('parse-document', async (event, filePath: string) => {
  try {
    const parser = new DocumentParser();
    const content = await parser.parse(filePath);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('extract-covenants', async (event, content: string) => {
  try {
    const extractor = new CovenantExtractor();
    const covenants = await extractor.extract(content);
    return { success: true, covenants };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('compare-versions', async (event, doc1Path: string, doc2Path: string) => {
  try {
    const parser = new DocumentParser();
    const content1 = await parser.parse(doc1Path);
    const content2 = await parser.parse(doc2Path);
    
    const comparator = new VersionComparator();
    const differences = comparator.compare(content1, content2);
    
    return { success: true, differences };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('analyze-risk', async (_event, loanData: LoanRiskData) => {
  try {
    const analyzer = new RiskAnalyzer();
    const riskAnalysis = analyzer.analyze(loanData);
    return { success: true, riskAnalysis };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-loan-health', async (_event, _loanId: string) => {
  try {
    // In a real app, this would fetch from a database
    // For prototype, return mock health data
    const health = {
      overall: 'healthy',
      score: 85,
      metrics: {
        documentCompliance: 90,
        covenantAdherence: 85,
        reportingTimeliness: 80,
        riskLevel: 'low'
      }
    };
    return { success: true, health };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('load-demo-data', async () => {
  try {
    const loan = DemoDataLoader.getLoan();
    const covenants = DemoDataLoader.getCovenants();
    const obligations = DemoDataLoader.getObligations();
    const issues = DemoDataLoader.getIssues();
    const auditLog = DemoDataLoader.getAuditLog();
    const healthScore = DemoDataLoader.getHealthScore();
    
    return {
      success: true,
      data: {
        loan,
        covenants,
        obligations,
        issues,
        auditLog,
        healthScore
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
