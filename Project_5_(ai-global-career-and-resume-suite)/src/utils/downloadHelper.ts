import { jsPDF } from "jspdf";

/**
 * Downloads plain text as a Markdown file.
 */
export function downloadAsMd(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".md") ? filename : `${filename}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts markdown tables to HTML table syntax.
 */
function markdownToHtml(text: string): string {
  const lines = text.split("\n");
  let inTable = false;
  let inList = false;
  let html = "";
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is a table row
    if (line.startsWith("|") && line.endsWith("|")) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      // Check if it is a separator row (e.g. |---|---|)
      if (line.replace(/[\|\-\s]/g, "") === "") {
        continue;
      }
      
      inTable = true;
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable) {
        html += "<table>";
        for (let r = 0; r < tableRows.length; r++) {
          html += "<tr>";
          for (let c = 0; c < tableRows[r].length; c++) {
            const cellTag = r === 0 ? "th" : "td";
            html += `<${cellTag}>${tableRows[r][c]}</${cellTag}>`;
          }
          html += "</tr>";
        }
        html += "</table>\n";
        tableRows = [];
        inTable = false;
      }
      
      let processedLine = line;
      const isBullet = processedLine.startsWith("* ") || processedLine.startsWith("- ") || processedLine.startsWith("• ");
      
      if (isBullet) {
        if (!inList) {
          html += "<ul>\n";
          inList = true;
        }
        const itemContent = processedLine.replace(/^[\*\-•]\s*/, "");
        processedLine = `<li>${itemContent}</li>`;
      } else {
        if (inList) {
          html += "</ul>\n";
          inList = false;
        }
        
        const headingMatch = processedLine.match(/^(#{1,6})\s*(.*)$/);
        const sectionMatch = processedLine.match(/^([1-7]\.\s+.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2].replace(/\s*#+\s*$/, "").trim();
          processedLine = `<h${level}>${headingText}</h${level}>`;
        } else if (sectionMatch) {
          processedLine = `<h2>${processedLine.trim()}</h2>`;
        }
      }
      
      // Clean bold markdown **text** to HTML <strong>text</strong>
      processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      
      html += processedLine + "\n";
    }
  }
  
  if (inTable && tableRows.length > 0) {
    html += "<table>";
    for (let r = 0; r < tableRows.length; r++) {
      html += "<tr>";
      for (let c = 0; c < tableRows[r].length; c++) {
        const cellTag = r === 0 ? "th" : "td";
        html += `<${cellTag}>${tableRows[r][c]}</${cellTag}>`;
      }
      html += "</tr>";
    }
    html += "</table>\n";
  }
  
  if (inList) {
    html += "</ul>\n";
  }
  
  return html;
}

/**
 * Downloads content as a Word-compatible (.docx) file.
 * Storing it as basic HTML styled block works beautifully with MS Word/Google Docs opening it.
 */
export function downloadAsDocx(filename: string, content: string) {
  const parsedContent = markdownToHtml(content);
  // We format with some simple HTML wraps so Word reads it with nice margins and headings
  const formattedHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; padding: 20px; }
        h1, h2, h3, h4 { color: #1e293b; font-family: 'Arial', sans-serif; }
        h1 { font-size: 22px; margin-top: 20px; margin-bottom: 10px; }
        h2 { font-size: 18px; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 15px; margin-top: 15px; margin-bottom: 6px; }
        h4 { font-size: 13px; margin-top: 12px; margin-bottom: 4px; }
        pre { background: #f1f5f9; padding: 10px; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; font-size: 11px; }
        th { background-color: #f8fafc; font-weight: bold; }
      </style>
    </head>
    <body>
      ${parsedContent
        .replace(/\n/g, "<br/>")
        .replace(/<\/tr><br\/>/g, "</tr>")
        .replace(/<\/table><br\/>/g, "</table>")
        .replace(/<\/h1><br\/>/g, "</h1>")
        .replace(/<\/h2><br\/>/g, "</h2>")
        .replace(/<\/h3><br\/>/g, "</h3>")
        .replace(/<\/h4><br\/>/g, "</h4>")}
    </body>
    </html>
  `;

  const blob = new Blob([formattedHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".docx") ? filename : `${filename}.docx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates and downloads a PDF file using jsPDF.
 * Renders multiple pages automatically based on content length.
 */
export function downloadAsPdf(filename: string, title: string, content: string) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxLineWidth = pageWidth - margin * 2;
  
  const isResumeOrLetter = filename.toLowerCase().includes("resume") || 
                           filename.toLowerCase().includes("letter") || 
                           filename.toLowerCase().includes("motivation") || 
                           title.toLowerCase().includes("resume") || 
                           title.toLowerCase().includes("letter") || 
                           title.toLowerCase().includes("motivation");
  
  let currentY = 20;

  if (!isResumeOrLetter) {
    // Set Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), margin, 20);
    
    // Draw spacer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 24, pageWidth - margin, 24);
    currentY = 32;
  }
  
  // Split the content text into lines
  const sanitizedContent = content.replace(/\r\n/g, "\n");
  const paragraphs = sanitizedContent.split("\n");
  
  const lineHeight = 6;
  const paragraphSpacing = 4;
  
  let i = 0;
  while (i < paragraphs.length) {
    const p = paragraphs[i].trim();
    
    // Check if it's a table row
    if (p.startsWith("|") && p.endsWith("|")) {
      // Collect consecutive table rows
      const tableRows: string[][] = [];
      while (i < paragraphs.length && paragraphs[i].trim().startsWith("|") && paragraphs[i].trim().endsWith("|")) {
        const rowText = paragraphs[i].trim();
        // Ignore separator row e.g. |---|---|
        if (rowText.replace(/[\|\-\s]/g, "") !== "") {
          const cells = rowText.split("|").slice(1, -1).map(c => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      
      if (tableRows.length > 0) {
        const numCols = tableRows[0].length;
        
        // Compute column weights
        const colMaxChars = Array(numCols).fill(0);
        tableRows.forEach(row => {
          row.forEach((cell, colIdx) => {
            if (colIdx < numCols) {
              colMaxChars[colIdx] = Math.max(colMaxChars[colIdx], cell.length);
            }
          });
        });
        
        const totalWeight = colMaxChars.reduce((sum, len) => sum + len, 0) || 1;
        const colWidths: number[] = [];
        for (let c = 0; c < numCols; c++) {
          const weight = colMaxChars[c] / totalWeight;
          colWidths.push(Math.max(15, weight * maxLineWidth));
        }
        
        // Normalize colWidths to fit exactly maxLineWidth
        const currentTotal = colWidths.reduce((sum, w) => sum + w, 0);
        for (let c = 0; c < numCols; c++) {
          colWidths[c] = (colWidths[c] / currentTotal) * maxLineWidth;
        }
        
        // Render rows
        for (let r = 0; r < tableRows.length; r++) {
          const row = tableRows[r];
          
          // Determine height of this row based on cell word wraps
          let maxLines = 1;
          row.forEach((cell, colIdx) => {
            if (colIdx >= numCols) return;
            const w = colWidths[colIdx];
            doc.setFont("Helvetica", r === 0 ? "bold" : "normal");
            doc.setFontSize(r === 0 ? 9.5 : 8.5);
            const safeCell = (cell || "").replace(/<br\s*\/?>/gi, "\n");
            const lines = doc.splitTextToSize(safeCell, w - 4);
            if (lines.length > maxLines) {
              maxLines = lines.length;
            }
          });
          const rowHeight = maxLines * 5 + 4; // 5mm per line of text + 4mm vertical padding
          
          // Check page boundary
          if (currentY > 20 && currentY + rowHeight > pageHeight - margin) {
            doc.addPage();
            currentY = 20; // reset Y for new page
          }
          
          let currentX = margin;
          row.forEach((cell, colIdx) => {
            if (colIdx >= numCols) return;
            const w = colWidths[colIdx];
            
            // Draw cell background / rect
            doc.setDrawColor(200, 200, 200);
            if (r === 0) {
              doc.setFillColor(241, 245, 249); // light blue-gray header
              doc.rect(currentX, currentY, w, rowHeight, "FD");
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(9.5);
              doc.setTextColor(30, 41, 59);
            } else {
              doc.rect(currentX, currentY, w, rowHeight, "S");
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(50, 50, 50);
            }
            
            // Render wrapped text inside cell
            const safeCell = (cell || "").replace(/<br\s*\/?>/gi, "\n");
            const lines = doc.splitTextToSize(safeCell, w - 4);
            lines.forEach((lineText: string, lineIdx: number) => {
              doc.text(lineText, currentX + 2, currentY + 4.5 + lineIdx * 5);
            });
            
            currentX += w;
          });
          
          currentY += rowHeight;
        }
        currentY += paragraphSpacing;
      }
    } else {
      const lineText = paragraphs[i].trim();
      if (lineText.length > 0) {
        let isHeading = false;
        let headingText = "";
        let fontSize = 10;
        let fontStyle = "normal";
        let color = [50, 50, 50];
        let spacingBefore = 0;
        let spacingAfter = 2;
        
        const headingMatch = lineText.match(/^(#{1,6})\s*(.*)$/);
        const sectionMatch = lineText.match(/^([1-7]\.\s+.*)$/);
        if (headingMatch) {
          isHeading = true;
          const level = headingMatch[1].length;
          headingText = headingMatch[2].replace(/\s*#+\s*$/, "").trim();
          
          if (level === 1) {
            fontSize = 16;
            fontStyle = "bold";
            color = [30, 41, 59];
            spacingBefore = 6;
          } else if (level === 2) {
            fontSize = 13.5;
            fontStyle = "bold";
            color = [30, 41, 59];
            spacingBefore = 5;
          } else if (level === 3) {
            fontSize = 12;
            fontStyle = "bold";
            color = [30, 41, 59];
            spacingBefore = 4;
          } else {
            fontSize = 11;
            fontStyle = "bold";
            color = [30, 41, 59];
            spacingBefore = 3;
          }
        } else if (sectionMatch) {
          isHeading = true;
          headingText = lineText.trim();
          fontSize = 12;
          fontStyle = "bold";
          color = [30, 41, 59];
          spacingBefore = 5;
          spacingAfter = 1;
        }
        
        if (isHeading) {
          currentY += spacingBefore;
          if (currentY + lineHeight > pageHeight - margin) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFont("Helvetica", fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(headingText, margin, currentY);
          currentY += lineHeight + spacingAfter;
        } else {
          // Normal wrapped text block
          const cleanText = lineText.replace(/\*\*([^*]+)\*\*/g, "$1");
          
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          
          const wrapped = doc.splitTextToSize(cleanText, maxLineWidth);
          const wrappedLines = Array.isArray(wrapped) ? wrapped : [wrapped];
          
          wrappedLines.forEach((line: string) => {
            if (currentY + lineHeight > pageHeight - margin) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(line, margin, currentY);
            currentY += lineHeight;
          });
          currentY += paragraphSpacing;
        }
      }
      i++;
    }
  }
  
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/**
 * Copies the provided string content to the clipboard and shows status.
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error("Clipboard copy failed: ", err);
    return false;
  }
}
