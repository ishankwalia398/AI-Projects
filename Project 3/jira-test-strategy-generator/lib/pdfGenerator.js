/**
 * PDF Generator
 * Implements pdf_generation_sop.md
 */

const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

class PdfGenerator {
  constructor() {
    this.tmpDir = path.join(__dirname, '..', '.tmp');
    this.ensureTmpDir();
  }

  /**
   * Generate Markdown and PDF files from test strategy
   * @param {string} markdown - Test strategy markdown content
   * @param {Object} metadata - JIRA metadata (jiraId, timestamp, title)
   * @returns {Promise<Object>} Both MD and PDF file data
   */
  async generate(markdown, metadata) {
    try {
      console.log(`📄 Generating files for ${metadata.jiraId}...`);

      const baseFilename = this.generateFilename(metadata.jiraId);
      const markdownFilename = `${baseFilename}.md`;
      const pdfFilename = `${baseFilename}.pdf`;

      // Save Markdown file
      const mdPath = path.join(this.tmpDir, markdownFilename);
      fs.writeFileSync(mdPath, markdown, 'utf8');

      // Generate PDF
      const pdfPath = path.join(this.tmpDir, pdfFilename);
      const pdfBuffer = await this.generatePDF(mdPath, pdfPath);

      console.log(`✅ Generated ${markdownFilename} and ${pdfFilename}`);

      // Read files as buffers
      const markdownBuffer = fs.readFileSync(mdPath);

      // Cleanup temp files after reading
      setTimeout(() => {
        try {
          if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
          if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        } catch (err) {
          console.warn('⚠️ Failed to cleanup temp files:', err.message);
        }
      }, 5000); // Cleanup after 5 seconds

      return {
        success: true,
        files: {
          markdown: {
            filename: markdownFilename,
            content: markdownBuffer.toString('utf8'),
            contentBase64: markdownBuffer.toString('base64'),
            size: markdownBuffer.length
          },
          pdf: {
            filename: pdfFilename,
            content: pdfBuffer.toString('base64'),
            size: pdfBuffer.length
          }
        },
        error: null
      };

    } catch (error) {
      console.error(`❌ Failed to generate files:`, error.message);
      return this.handleError(error);
    }
  }

  /**
   * Generate PDF from Markdown file
   */
  async generatePDF(mdPath, pdfPath) {
    try {
      const pdf = await mdToPdf(
        { path: mdPath },
        {
          dest: pdfPath,
          stylesheet: [this.getCustomCSS()],
          pdf_options: {
            format: 'A4',
            margin: {
              top: '25mm',
              right: '20mm',
              bottom: '25mm',
              left: '20mm'
            },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666; margin-top:10px;">Test Strategy Document</div>',
            footerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666; margin-bottom:10px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
          },
          launch_options: {
            headless: 'new',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage'
            ]
          }
        }
      );

      if (pdf && pdf.content) {
        return pdf.content;
      }

      // If content not returned, read from file
      return fs.readFileSync(pdfPath);

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Get custom CSS for PDF styling
   */
  getCustomCSS() {
    return `
      @page {
        size: A4;
        margin: 25mm 20mm;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
      }

      h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #1a1a1a;
        border-bottom: 3px solid #0066cc;
        padding-bottom: 10px;
        margin-top: 30px;
        page-break-after: avoid;
      }

      h2 {
        font-size: 18pt;
        font-weight: bold;
        color: #0066cc;
        margin-top: 25px;
        page-break-after: avoid;
      }

      h3 {
        font-size: 14pt;
        font-weight: bold;
        color: #333;
        margin-top: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        page-break-inside: avoid;
      }

      th {
        background-color: #0066cc;
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: bold;
      }

      td {
        border: 1px solid #ddd;
        padding: 8px;
      }

      tr:nth-child(even) {
        background-color: #f9f9f9;
      }

      code {
        background-color: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 10pt;
      }

      pre {
        background-color: #f5f5f5;
        padding: 15px;
        border-left: 4px solid #0066cc;
        overflow-x: auto;
        page-break-inside: avoid;
      }

      ul, ol {
        margin-left: 20px;
        margin-bottom: 15px;
      }

      li {
        margin-bottom: 5px;
      }

      blockquote {
        border-left: 4px solid #0066cc;
        padding-left: 15px;
        margin-left: 0;
        font-style: italic;
        color: #666;
      }

      strong {
        font-weight: bold;
        color: #1a1a1a;
      }

      a {
        color: #0066cc;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }
    `;
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(jiraId) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z/, '')
      .replace('T', '_')
      .substring(0, 15); // Format: 20260612_143045

    return `TestStrategy_${jiraId}_${timestamp}`;
  }

  /**
   * Ensure temp directory exists
   */
  ensureTmpDir() {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  /**
   * Error handling
   */
  handleError(error) {
    let errorCode = 'PDF_GENERATION_FAILED';
    let errorMessage = 'Failed to generate PDF';

    if (error.message.includes('Puppeteer')) {
      errorCode = 'PUPPETEER_ERROR';
      errorMessage = 'PDF generator initialization failed. Try again.';
    } else if (error.message.includes('ENOSPC')) {
      errorCode = 'DISK_SPACE_ERROR';
      errorMessage = 'Insufficient disk space for PDF generation.';
    } else if (error.message.includes('timeout')) {
      errorCode = 'PDF_TIMEOUT';
      errorMessage = 'PDF generation timed out. Document may be too large.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      files: null,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error.stack
      }
    };
  }
}

module.exports = PdfGenerator;
