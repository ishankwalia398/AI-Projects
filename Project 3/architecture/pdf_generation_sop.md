# PDF Generation SOP
**Standard Operating Procedure for Converting Markdown to PDF**

---

## 🎯 Goal
Convert generated Test Strategy Markdown documents to professionally formatted PDF files with proper styling, headers, and page breaks.

---

## 📥 Input Schema
```json
{
  "markdown": "string",        // Full Markdown content
  "metadata": {
    "jiraId": "string",       // e.g., "MTP-17248"
    "timestamp": "ISO8601",   // Generation timestamp
    "title": "string"         // Document title
  }
}
```

---

## 📤 Output Schema
```json
{
  "success": true,
  "files": {
    "markdown": {
      "filename": "TestStrategy_MTP-17248_20260612_143045.md",
      "content": "string",
      "size": "number"
    },
    "pdf": {
      "filename": "TestStrategy_MTP-17248_20260612_143045.pdf",
      "content": "base64",     // PDF binary as base64
      "size": "number"
    }
  },
  "error": null
}
```

---

## 🔧 Implementation Strategy

### Library Choice: `md-to-pdf`
**Why:**
- Modern, actively maintained (2024+)
- Built on Puppeteer (headless Chrome)
- Custom CSS styling support
- Handles complex Markdown (tables, code blocks, nested lists)
- Good performance (~2-5 seconds per document)

### Alternative (if md-to-pdf fails):
- **Puppeteer directly:** More control, higher complexity
- **jsPDF + html2canvas:** Client-side, lower quality

---

## 🔧 Implementation Logic

### Step 1: Prepare Markdown File
Create a temporary markdown file with enhanced styling:

```javascript
const fs = require('fs');
const path = require('path');

// Add custom CSS header to Markdown
const styledMarkdown = `
---
pdf_options:
  format: A4
  margin: 25mm 20mm
  printBackground: true
  displayHeaderFooter: true
  headerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666;">Test Strategy Document</div>'
  footerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
---

${markdown}
`;

// Write to temp file
const tempMdPath = path.join('.tmp', `${metadata.jiraId}_${Date.now()}.md`);
fs.writeFileSync(tempMdPath, styledMarkdown, 'utf8');
```

### Step 2: Apply Custom CSS Styling
Create a professional stylesheet:

```css
/* custom-style.css */
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

.page-break {
  page-break-after: always;
}

/* Cover page styling */
.cover-page {
  text-align: center;
  padding-top: 150px;
}

.cover-page h1 {
  font-size: 32pt;
  border: none;
}

.cover-page .metadata {
  margin-top: 50px;
  font-size: 12pt;
  color: #666;
}
```

### Step 3: Generate PDF
```javascript
const mdToPdf = require('md-to-pdf');

async function generatePDF(markdownPath, outputPath) {
  try {
    const { content } = await mdToPdf(
      { path: markdownPath },
      {
        dest: outputPath,
        stylesheet: ['custom-style.css'],
        body_class: ['markdown-body'],
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
          headerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666;">Test Strategy Document</div>',
          footerTemplate: '<div style="font-size:9px; width:100%; text-align:center; color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
        },
        launch_options: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    );
    
    return {
      success: true,
      pdfBuffer: content
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Step 4: Filename Generation
```javascript
function generateFilename(jiraId) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z/, '')
    .replace('T', '_')
    .substring(0, 15);  // Format: 20260612_143045
  
  return `TestStrategy_${jiraId}_${timestamp}`;
}

// Example: TestStrategy_MTP-17248_20260612_143045.pdf
```

### Step 5: Return Files
```javascript
const markdownFilename = `${baseFilename}.md`;
const pdfFilename = `${baseFilename}.pdf`;

return {
  success: true,
  files: {
    markdown: {
      filename: markdownFilename,
      content: markdown,
      size: Buffer.byteLength(markdown, 'utf8')
    },
    pdf: {
      filename: pdfFilename,
      content: pdfBuffer.toString('base64'),
      size: pdfBuffer.length
    }
  }
};
```

---

## ⚠️ Error Handling

### Common Errors
1. **Puppeteer Launch Failed**
   - Missing Chrome/Chromium
   - Action: Use `puppeteer-core` with bundled Chromium

2. **Markdown Parsing Error**
   - Invalid Markdown syntax
   - Action: Sanitize and validate markdown before conversion

3. **Memory Limit Exceeded**
   - Document too large (> 10MB)
   - Action: Split into multiple PDFs or reduce image sizes

4. **Timeout**
   - PDF generation > 30 seconds
   - Action: Increase timeout or optimize document

5. **File System Error**
   - Insufficient disk space
   - Action: Check available space, clean temp files

### Error Response Format
```json
{
  "success": false,
  "files": null,
  "error": {
    "code": "PDF_GENERATION_FAILED",
    "message": "Failed to generate PDF",
    "details": "Puppeteer launch failed: ..."
  }
}
```

---

## 🧪 Quality Assurance

### PDF Validation Checklist
- [ ] All headers properly styled (H1, H2, H3)
- [ ] Tables rendered correctly with borders
- [ ] Code blocks preserved with monospace font
- [ ] Page breaks at logical sections
- [ ] Header/footer on every page
- [ ] No text overflow or truncation
- [ ] Links clickable (if applicable)
- [ ] File size < 5MB (typical: 500KB-2MB)

### Visual Quality Checks
```javascript
function validatePDF(pdfBuffer) {
  const checks = {
    sizeOk: pdfBuffer.length < 5 * 1024 * 1024,  // < 5MB
    isValidPDF: pdfBuffer.slice(0, 4).toString() === '%PDF',
    notEmpty: pdfBuffer.length > 10000  // > 10KB
  };
  
  return Object.values(checks).every(Boolean);
}
```

---

## 📊 Performance Notes
- Average generation time: 2-5 seconds
- File size: 500KB - 2MB (typical)
- Memory usage: ~100MB (Puppeteer overhead)
- Concurrent generation: Max 3 PDFs at once

---

## 🎨 Styling Guidelines

### Typography
- **Body:** 11pt, line-height 1.6
- **H1:** 24pt, bold, blue underline
- **H2:** 18pt, bold, blue text
- **H3:** 14pt, bold, black text

### Colors
- **Primary:** #0066cc (blue for headers)
- **Text:** #333 (dark gray)
- **Background:** #f9f9f9 (light gray for alternating table rows)
- **Border:** #ddd (light gray)

### Spacing
- **Margins:** 25mm top/bottom, 20mm left/right
- **Section spacing:** 25-30px between sections
- **Paragraph spacing:** 15px

---

## 🔒 Security Considerations
- Sanitize markdown to prevent XSS in PDF metadata
- Validate file paths to prevent directory traversal
- Clean up temp files after generation
- Limit PDF file size to prevent DoS
- Disable external resources in Puppeteer (no remote images/scripts)

---

## 🗂️ File Management

### Temporary Files
- Store in `.tmp/` directory
- Clean up after 1 hour
- Auto-cleanup on server restart

### Cleanup Script
```javascript
const fs = require('fs');
const path = require('path');

function cleanupTempFiles() {
  const tmpDir = path.join(__dirname, '.tmp');
  const now = Date.now();
  const maxAge = 60 * 60 * 1000;  // 1 hour
  
  fs.readdirSync(tmpDir).forEach(file => {
    const filePath = path.join(tmpDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up: ${file}`);
    }
  });
}

// Run every 30 minutes
setInterval(cleanupTempFiles, 30 * 60 * 1000);
```

---

## 📝 Maintenance Log
- **2026-06-12:** Initial SOP created - selected `md-to-pdf` as primary library
- **Next Review:** After Phase 3 implementation and quality testing
