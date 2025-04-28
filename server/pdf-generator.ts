
import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';

export async function generateProjectDocumentation() {
  const doc = new PDFDocument();
  const output = fs.createWriteStream('project-documentation.pdf');
  doc.pipe(output);

  // Title
  doc.fontSize(25).text('API Gateway Documentation', {align: 'center'});
  doc.moveDown();

  // Project Overview
  doc.fontSize(20).text('Project Overview');
  doc.fontSize(12).text('A lightweight API Gateway/Proxy Service built with Go, featuring a React Dashboard for configuration and monitoring. The project demonstrates concurrent programming, networking, and web development skills.');
  doc.moveDown();

  // Main Features
  doc.fontSize(20).text('Key Features');
  doc.fontSize(12);
  doc.list([
    'API Gateway with Go-based proxy functionality',
    'React Dashboard for monitoring and configuration',
    'Real-time traffic monitoring and statistics',
    'Route management and configuration',
    'Service health monitoring',
    'Authentication and authorization',
    'Rate limiting capabilities'
  ]);
  doc.moveDown();

  // Architecture
  doc.fontSize(20).text('Architecture');
  doc.fontSize(12).text('The system consists of:');
  doc.list([
    'Frontend: React-based dashboard with TypeScript',
    'Backend: Express.js server handling API requests',
    'Gateway: Go-based proxy service',
    'Real-time updates via WebSocket'
  ]);
  doc.moveDown();

  // Components
  doc.fontSize(20).text('Main Components');
  doc.fontSize(16).text('1. API Gateway');
  doc.fontSize(12).text('The Go-based gateway provides:');
  doc.list([
    'Request proxying and routing',
    'Rate limiting implementation',
    'Authentication handling',
    'Health checking of services'
  ]);
  doc.moveDown();

  doc.fontSize(16).text('2. Dashboard');
  doc.fontSize(12).text('The React dashboard offers:');
  doc.list([
    'Real-time traffic monitoring',
    'Route configuration interface',
    'Service health visualization',
    'User authentication management'
  ]);
  doc.moveDown();

  // Implementation Details
  doc.fontSize(20).text('Technical Implementation');
  doc.fontSize(12).text('Technologies used:');
  doc.list([
    'Go for the proxy service',
    'React with TypeScript for the frontend',
    'Express.js for the API server',
    'WebSocket for real-time updates',
    'PostgreSQL for data storage'
  ]);

  doc.end();
  return new Promise((resolve) => output.on('finish', resolve));
}
