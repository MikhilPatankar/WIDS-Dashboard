import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal'; // Corrected path
import { ReportData } from '../types';
import * as reportService from '../services/reportService';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Import jspdf-autotable for table support
import { ArrowPathIcon, DocumentArrowDownIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext'; // Corrected path

const API_KEY = typeof process !== 'undefined' && process.env && process.env.API_KEY ? process.env.API_KEY : undefined;

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// NOTE: The manual 'declare module "jspdf"' block has been removed.
// The 'jspdf-autotable' import is expected to provide the necessary type augmentation.

const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({ isOpen, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!API_KEY && isOpen) {
      setError("Gemini API Key not configured. PDF generation will be limited.");
      addToast('warning', 'API Key Missing', 'Gemini API Key is not set. AI-assisted report generation is unavailable.');
    } else if (API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
    }
  }, [isOpen, addToast]);
  
  const resetModalState = () => {
    setStartDate(sevenDaysAgo);
    setEndDate(today);
    setIsLoading(false);
    setReportData(null);
    setGeminiResponse(null);
    setPdfDataUri(null);
    setError(null);
  };

  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  const generatePdfFromGeminiResponse = (geminiText: string, rawReportData: ReportData) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" }); // Use points for finer control
    let yPos = 40; 
    const lineSpacing = 18; // Increased spacing
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 40;
    const contentWidth = pdf.internal.pageSize.width - margin * 2;

    const addPageIfNeeded = (spaceNeeded = lineSpacing) => {
      if (yPos + spaceNeeded > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
    };

    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(rawReportData.report_title || "WIDS System Report", pdf.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += lineSpacing * 2;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Report ID: ${rawReportData.report_id}`, margin, yPos);
    yPos += lineSpacing * 0.8;
    pdf.text(`Generated At: ${new Date(rawReportData.generated_at).toLocaleString()}`, margin, yPos);
    yPos += lineSpacing * 1.5;
    
    const sections = geminiText.split(/\nSECTION:\s*/i).slice(1); 

    sections.forEach(sectionText => {
        addPageIfNeeded(lineSpacing * 2); // Space for section title
        const lines = sectionText.split('\n');
        const sectionTitle = lines[0]?.trim() || "Untitled Section";
        
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text(sectionTitle, margin, yPos);
        yPos += lineSpacing * 1.2;
        addPageIfNeeded();
        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(10);
        let summaryContent = "";
        let tableHeaders: string[] = [];
        let tableData: string[][] = [];
        let detailsMode = false;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("SUMMARY:")) {
                detailsMode = false;
                continue;
            } else if (line.startsWith("DETAILS_TABLE_HEADERS:")) {
                detailsMode = true;
                tableHeaders = line.replace("DETAILS_TABLE_HEADERS:", "").split(',').map(h => h.trim());
                tableData = []; 
                continue;
            } else if (line.startsWith("DETAILS_TABLE_DATA_SUMMARY:")) {
                 // Display table summary if provided by Gemini
                const tableSummary = line.replace("DETAILS_TABLE_DATA_SUMMARY:", "").trim();
                if(tableSummary) {
                    pdf.setFontSize(9);
                    pdf.setTextColor(100);
                    const summaryLines = pdf.splitTextToSize(tableSummary, contentWidth);
                     summaryLines.forEach((sLine: string) => {
                        pdf.text(sLine, margin, yPos);
                        yPos += lineSpacing * 0.7;
                        addPageIfNeeded(lineSpacing * 0.7);
                    });
                    pdf.setTextColor(0);
                    pdf.setFontSize(10);
                }
                continue;
            } else if (line.startsWith("CHART_SUGGESTION:") || line.startsWith("CHART_DATA:")) {
                 pdf.setFontSize(9);
                 pdf.setTextColor(100); 
                 const chartInfoLines = pdf.splitTextToSize(line, contentWidth);
                 chartInfoLines.forEach((ciLine: string) => {
                    pdf.text(ciLine, margin, yPos);
                    yPos += lineSpacing * 0.7;
                    addPageIfNeeded(lineSpacing * 0.7);
                 });
                 pdf.setTextColor(0); 
                 pdf.setFontSize(10);
                 continue;
            }


            if (detailsMode && tableHeaders.length > 0) {
                 if(line && !line.startsWith("DETAILS_TABLE_DATA:")) tableData.push(line.split(',').map(d => d.trim()));
            } else if(!detailsMode && line) {
                summaryContent += line + '\n';
            }
        }
        
        if (summaryContent.trim()) {
            const summaryLines = pdf.splitTextToSize(summaryContent.trim(), contentWidth);
            summaryLines.forEach((sLine: string) => {
                pdf.text(sLine, margin, yPos);
                yPos += lineSpacing * 0.9;
                addPageIfNeeded();
            });
            yPos += lineSpacing * 0.5;
        }

        if (tableData.length > 0 && tableHeaders.length > 0) {
            addPageIfNeeded(lineSpacing * (tableData.length + 1)); // Estimate space for table
            (pdf as any).autoTable({ 
                head: [tableHeaders],
                body: tableData,
                startY: yPos,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [59, 130, 246], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
                margin: { left: margin, right: margin },
                tableWidth: 'auto', // or 'wrap'
                columnStyles: { 0: { cellWidth: 'auto' } }, // Example for first column
            });
            yPos = (pdf as any).lastAutoTable.finalY + lineSpacing; 
            addPageIfNeeded();
        }
        yPos += lineSpacing; 
    });

    setPdfDataUri(pdf.output('datauristring'));
  };


  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportData(null);
    setGeminiResponse(null);
    setPdfDataUri(null);

    try {
      const rawData = await reportService.generateReportData(startDate, endDate);
      setReportData(rawData);

      if (!aiRef.current) {
        addToast('info', 'Generating Basic PDF', 'Gemini AI not available, generating PDF from raw data structure.');
        const pdf = new jsPDF();
        pdf.setFontSize(10);
        const rawJsonString = JSON.stringify(rawData, null, 2);
        const lines = pdf.splitTextToSize(rawJsonString, pdf.internal.pageSize.width - 20);
        pdf.text(lines, 10, 10);
        setPdfDataUri(pdf.output('datauristring'));
        setIsLoading(false);
        return;
      }

      const prompt = `You are a report generation assistant for a WiFi Intrusion Detection System (WIDS).
Given the following JSON data, create a comprehensive and well-structured WIDS system report.
The report should be formatted as structured text that can be easily parsed to generate a PDF.
For each section in the JSON:
1.  Start with "SECTION: [Section Title]".
2.  Follow with "SUMMARY:" and then provide a CONCISE summary based on the 'summary' object in the JSON. Each key point on a new line.
3.  If 'details' array exists and is not empty:
    a.  If details look like tabular data (array of objects with similar keys):
        i.   If the table is long (e.g., > 10 items), provide a brief summary line BEFORE the table, like "DETAILS_TABLE_DATA_SUMMARY: Showing top 5 attack events by count. Total X events analyzed." (Adapt summary based on context).
        ii.  Output "DETAILS_TABLE_HEADERS: [comma-separated headers]". Choose relevant headers.
        iii. Then, for each item in 'details' (or a summarized subset if very long), output lines of comma-separated values matching the headers. Each row of data on a new line.
    b.  If details are not tabular or are short, list them under a "DETAILS:" heading.
4.  For sections with numeric data suitable for visualization (e.g., attack counts, dataset sizes):
    a.  Output "CHART_SUGGESTION: [Description of a suitable chart, e.g., Bar chart for 'Attack Name' vs 'Event Count']".
    b.  Output "CHART_DATA: [JSON array of objects for the chart, e.g., [{"name": "DDoS", "value": 45}, ...]]". Be SELECTIVE; only include data that makes for a clear, uncluttered chart. For example, top 5-7 categories for a pie/bar chart.

Here is the data:
\`\`\`json
${JSON.stringify(rawData, null, 2)}
\`\`\`
Ensure the output is clean and follows this structured text format precisely. Focus on conciseness and clarity.`;

      const response: GenerateContentResponse = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17", 
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      const geminiText = response.text;
      setGeminiResponse(geminiText);
      addToast('success', 'AI Analysis Complete', 'Report content structured by Gemini.');
      generatePdfFromGeminiResponse(geminiText, rawData);

    } catch (err: any) {
      console.error("Error generating report:", err);
      setError(err.message || "Failed to generate report.");
      addToast('error', 'Report Generation Failed', err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadPdf = () => {
    if (pdfDataUri) {
      // Convert base64 to Blob
      const byteString = atob(pdfDataUri.split(',')[1]);
      const mimeString = pdfDataUri.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      
      // Create URL and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WIDS_Report_${reportData?.report_id || Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'Download Started', 'Your PDF report is downloading.');

    } else {
       addToast('error', 'Download Failed', 'No PDF has been generated yet.');
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Generate System Report" size="4xl"> {/* Changed size to 4xl */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary mb-1">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1 mb-0.5"/>Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              max={endDate}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary mb-1">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1 mb-0.5"/>End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              min={startDate}
              max={today}
            />
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isLoading || !startDate || !endDate}
          className="btn-primary w-full mt-2"
        >
          {isLoading ? (
            <><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Generating Report...</>
          ) : (
            'Generate Report'
          )}
        </button>

        {error && <p className="text-sm text-danger text-center mt-2">{error}</p>}

        {pdfDataUri && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-text-primary">Report Preview</h3>
            <div className="border border-tertiary-dark rounded-md overflow-hidden">
              <iframe
                src={pdfDataUri}
                className="w-full h-[600px]" // Increased preview height
                title="Report Preview"
              ></iframe>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2"/>
              Download PDF
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReportGeneratorModal;