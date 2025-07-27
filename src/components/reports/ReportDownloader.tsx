// src/components/reports/ReportDownloader.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Image, FileText, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface ReportDownloaderProps {
  targetElementId: string;
  filename: string;
  showText?: boolean;
}

// 🔥 헬퍼 함수 정의
const getElementValue = (element: Element): string => {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const dataValue = element.getAttribute('data-value');
  if (dataValue) return dataValue;

  const textContent = element.textContent?.trim();
  if (textContent) return textContent;

  if (element instanceof HTMLSelectElement) {
    return element.value;
  }

  if (element instanceof HTMLInputElement) {
    return element.value;
  }

  return '반입';
};

const ReportDownloader: React.FC<ReportDownloaderProps> = ({
  targetElementId,
  filename,
  showText = true
}) => {
  const [downloading, setDownloading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // 🔥 테이블 행 수 계산 함수
  const getTableRowCount = (element: HTMLElement): number => {
    const tables = element.querySelectorAll('table');
    const mainTable = Array.from(tables).find(table => {
      const tbody = table.querySelector('tbody');
      return tbody && tbody.children.length > 0;
    });

    if (!mainTable) return 0;
    const tbody = mainTable.querySelector('tbody');
    return tbody?.children.length || 0;
  };

  // 🔥 보고서 타입 확인 함수
  const getReportType = (element: HTMLElement): { isInvoice: boolean; isMobile: boolean } => {
    const isInvoice = element.classList.contains('invoice-container') ||
      element.querySelector('.invoice-container') !== null;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    return { isInvoice, isMobile };
  };

  // 🔥 PNG 다중 이미지 다운로드
  const downloadAsMultipleImages = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      const rowCount = getTableRowCount(element);
      const { isInvoice, isMobile } = getReportType(element);

      // 페이지당 행 수 결정
      const maxRowsPerPage = isMobile
        ? (isInvoice ? 12 : 10)  // 모바일
        : (isInvoice ? 20 : 15); // 데스크톱

      if (rowCount <= maxRowsPerPage) {
        // 한 페이지면 기존 방식
        await downloadSingleImage(element);
        return;
      }

      // 🔥 다중 이미지 생성
      const totalPages = Math.ceil(rowCount / maxRowsPerPage);
      const tables = element.querySelectorAll('table');
      const mainTable = Array.from(tables).find(table => {
        const tbody = table.querySelector('tbody');
        return tbody && tbody.children.length > 0;
      });

      if (!mainTable) {
        await downloadSingleImage(element);
        return;
      }

      const tbody = mainTable.querySelector('tbody');
      if (!tbody) return;

      const originalRows = Array.from(tbody.children);

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        // 🔥 페이지별 요소 생성
        const pageElement = element.cloneNode(true) as HTMLElement;
        pageElement.classList.add('download-optimized');

        // 🔥 헤더 정보 처리 (청구서의 경우 첫 페이지만)
        if (isInvoice && pageIndex > 0) {
          const siteInfoTables = pageElement.querySelectorAll('table');
          siteInfoTables.forEach((table, index) => {
            if (index === 0) {
              table.style.display = 'none';
            }
          });
        }

        // 🔥 현재 페이지 행만 표시
        const pageTableBody = pageElement.querySelector('tbody');
        if (pageTableBody) {
          pageTableBody.innerHTML = '';

          const startIndex = pageIndex * maxRowsPerPage;
          const endIndex = Math.min(startIndex + maxRowsPerPage, originalRows.length);
          const pageRows = originalRows.slice(startIndex, endIndex);

          pageRows.forEach(row => {
            pageTableBody.appendChild(row.cloneNode(true));
          });
        }

        // 🔥 마지막 페이지가 아니면 합계 행 제거
        if (pageIndex < totalPages - 1) {
          const summaryRows = pageElement.querySelectorAll('.bg-gray-100, .bg-blue-50');
          summaryRows.forEach(row => {
            if (row.parentElement) {
              row.parentElement.removeChild(row);
            }
          });
        }

        // 🔥 페이지 번호 추가
        const pageInfo = document.createElement('div');
        pageInfo.style.cssText = `
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 10px;
          font-weight: bold;
          padding: 5px 0;
        `;
        pageInfo.textContent = `페이지 ${pageIndex + 1} / ${totalPages}`;
        pageElement.appendChild(pageInfo);

        // 🔥 캔버스 생성
        const canvas = await html2canvas(pageElement, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: false,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: false,
          logging: false,
          onclone: (clonedDoc, clonedElement) => {
            applyImageStyles(clonedDoc, clonedElement);
          }
        });

        // 🔥 이미지 다운로드
        const imgData = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${filename}_${pageIndex + 1}.png`;
        link.href = imgData;
        link.click();

        // 브라우저 다운로드 제한을 피하기 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "다운로드 완료",
        description: `${totalPages}개의 PNG 이미지가 다운로드되었습니다.`,
      });

    } catch (error) {
      console.error('Multi-image download error:', error);
      toast({
        title: "다운로드 실패",
        description: "이미지 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
      setIsDialogOpen(false);
    }
  };

  // 🔥 단일 이미지 다운로드
  const downloadSingleImage = async (element: HTMLElement) => {
    const originalClasses = element.className;
    element.classList.add('download-optimized');

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: false,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        applyImageStyles(clonedDoc, clonedElement);
      }
    });

    element.className = originalClasses;

    const imgData = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = imgData;
    link.click();
  };

  // 🔥 PNG 이미지용 스타일
  const applyImageStyles = (clonedDoc: Document, clonedElement: HTMLElement) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      .download-optimized {
        background: white !important;
        color: black !important;
        font-family: Arial, sans-serif !important;
        padding: 16px !important;
        width: 800px !important;
        max-width: none !important;
        margin: 0 !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
      }
      
      .download-optimized table {
        width: 100% !important;
        border-collapse: collapse !important;
        border: 2px solid #000 !important;
        margin: 8px 0 !important;
        table-layout: fixed !important;
      }
      
      .download-optimized th,
      .download-optimized td {
        border: 1px solid #000 !important;
        padding: 8px 4px !important;
        text-align: center !important;
        font-size: 12px !important;
        line-height: 1.3 !important;
        vertical-align: middle !important;
        word-wrap: break-word !important;
        background: white !important;
        color: black !important;
        height: auto !important;
        min-height: 28px !important;
        white-space: normal !important;
      }
      
      .download-optimized th {
        background: #f0f0f0 !important;
        font-weight: bold !important;
        font-size: 13px !important;
      }

      .download-optimized .bg-gray-100 td,
      .download-optimized .bg-blue-50 td {
        font-size: 14px !important;
        font-weight: bold !important;
        background: #e0e0e0 !important;
        color: #000 !important;
      }

      .download-optimized .bg-gray-100 td:nth-child(2),
      .download-optimized .bg-gray-100 td:nth-child(4),
      .download-optimized .bg-gray-100 td:nth-child(6),
      .download-optimized .bg-blue-50 td:nth-child(2),
      .download-optimized .bg-blue-50 td:nth-child(4),
      .download-optimized .bg-blue-50 td:nth-child(6) {
        font-size: 24px !important;
        font-weight: 900 !important;
        color: #000 !important;
      }
      
      /* Select 드롭다운 요소를 텍스트로 변환 */
      .download-optimized select,
      .download-optimized button[role="combobox"],
      .download-optimized [data-radix-select-trigger] {
        appearance: none !important;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        padding: 4px !important;
        font-size: 12px !important;
        font-weight: normal !important;
        color: black !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        line-height: 1.3 !important;
      }
      
      .download-optimized select:after,
      .download-optimized select:before,
      .download-optimized button[role="combobox"]:after,
      .download-optimized button[role="combobox"]:before,
      .download-optimized [data-radix-select-trigger]:after,
      .download-optimized [data-radix-select-trigger]:before,
      .download-optimized [data-radix-select-icon],
      .download-optimized svg {
        display: none !important;
        visibility: hidden !important;
      }
      
      .download-optimized .text-lg { font-size: 18px !important; font-weight: bold !important; }
      .download-optimized .text-xl { font-size: 20px !important; font-weight: bold !important; }
      
      .download-optimized * {
        box-shadow: none !important;
        text-shadow: none !important;
        color: #000 !important;
      }
    `;

    // Select 요소를 텍스트로 변환
    const selectElements = clonedElement.querySelectorAll('select, button[role="combobox"], [data-radix-select-trigger]');
    selectElements.forEach(select => {
      const value = getElementValue(select);
      const textSpan = clonedDoc.createElement('span');
      textSpan.textContent = value;
      textSpan.style.cssText = `
        font-size: 11px !important;
        font-weight: bold !important;
        color: #000 !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        padding: 2px !important;
        line-height: 1.2 !important;
      `;

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    clonedDoc.head.appendChild(style);
  };

  // 🔥 PDF 다운로드 (다중 페이지 지원)
  const downloadAsPDF = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      const rowCount = getTableRowCount(element);
      const { isInvoice, isMobile } = getReportType(element);

      // 페이지당 행 수 결정
      const maxRowsPerPage = isMobile
        ? (isInvoice ? 12 : 10)  // 모바일
        : (isInvoice ? 18 : 15); // 데스크톱 (약간 줄임)

      if (rowCount <= maxRowsPerPage) {
        await downloadSinglePagePDF(element);
        return;
      }

      // 🔥 다중 페이지 PDF 생성
      await downloadMultiPagePDF(element, maxRowsPerPage, isInvoice, isMobile);

    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "다운로드 실패",
        description: "PDF 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
      setIsDialogOpen(false);
    }
  };

  // 🔥 단일 페이지 PDF
  const downloadSinglePagePDF = async (element: HTMLElement) => {
    const originalClasses = element.className;
    element.classList.add('download-optimized');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: false,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        applyPDFStyles(clonedDoc, clonedElement);
      }
    });

    element.className = originalClasses;

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    const x = (pdfWidth - finalWidth) / 2;
    const y = 5;

    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(`${filename}.pdf`);

    toast({
      title: "다운로드 완료",
      description: "PDF가 다운로드되었습니다.",
    });
  };

  // 🔥 다중 페이지 PDF
  const downloadMultiPagePDF = async (
    element: HTMLElement,
    maxRowsPerPage: number,
    isInvoice: boolean,
    isMobile: boolean
  ) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pageMargin = 8;
    const availableHeight = pdfHeight - (pageMargin * 2);

    const tables = element.querySelectorAll('table');
    const mainTable = Array.from(tables).find(table => {
      const tbody = table.querySelector('tbody');
      return tbody && tbody.children.length > 0;
    });

    if (!mainTable) {
      await downloadSinglePagePDF(element);
      return;
    }

    const tbody = mainTable.querySelector('tbody');
    if (!tbody) return;

    const originalRows = Array.from(tbody.children);
    const totalPages = Math.ceil(originalRows.length / maxRowsPerPage);

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // 🔥 페이지별 요소 생성
      const pageElement = element.cloneNode(true) as HTMLElement;
      pageElement.classList.add('download-optimized');

      // 🔥 헤더 정보 처리 (청구서의 경우 첫 페이지만)
      if (isInvoice && pageIndex > 0) {
        const siteInfoTables = pageElement.querySelectorAll('table');
        siteInfoTables.forEach((table, index) => {
          if (index === 0) {
            table.style.display = 'none';
          }
        });
      }

      // 🔥 현재 페이지 행만 표시
      const pageTableBody = pageElement.querySelector('tbody');
      if (pageTableBody) {
        pageTableBody.innerHTML = '';

        const startIndex = pageIndex * maxRowsPerPage;
        const endIndex = Math.min(startIndex + maxRowsPerPage, originalRows.length);
        const pageRows = originalRows.slice(startIndex, endIndex);

        pageRows.forEach(row => {
          pageTableBody.appendChild(row.cloneNode(true));
        });
      }

      // 🔥 마지막 페이지가 아니면 합계 행 제거
      if (pageIndex < totalPages - 1) {
        const summaryRows = pageElement.querySelectorAll('.bg-gray-100, .bg-blue-50');
        summaryRows.forEach(row => {
          if (row.parentElement) {
            row.parentElement.removeChild(row);
          }
        });
      }

      // 🔥 페이지 번호 추가
      const pageInfo = document.createElement('div');
      pageInfo.style.cssText = `
        text-align: center;
        font-size: 12px;
        color: #666;
        margin-top: 8px;
        font-weight: bold;
        padding: 4px 0;
      `;
      pageInfo.textContent = `페이지 ${pageIndex + 1} / ${totalPages}`;
      pageElement.appendChild(pageInfo);

      // 🔥 캔버스 생성
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        scrollX: 0,
        scrollY: 0,
        foreignObjectRendering: false,
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          applyPDFStyles(clonedDoc, clonedElement, true);
        }
      });

      // 🔥 PDF에 이미지 추가
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const maxWidth = pdfWidth - (pageMargin * 2);
      const ratio = Math.min(maxWidth / imgWidth, availableHeight / imgHeight);

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const x = (pdfWidth - finalWidth) / 2;
      const y = pageMargin;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    }

    pdf.save(`${filename}.pdf`);

    toast({
      title: "다운로드 완료",
      description: `PDF가 ${totalPages}페이지로 다운로드되었습니다.`,
    });
  };

  // 🔥 PDF용 스타일
  const applyPDFStyles = (
    clonedDoc: Document,
    clonedElement: HTMLElement,
    isMultiPage: boolean = false
  ) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      .download-optimized {
        background: white !important;
        color: black !important;
        font-family: Arial, sans-serif !important;
        padding: 20px !important;
        width: 900px !important;
        max-width: none !important;
        margin: 0 !important;
        font-size: 16px !important;
        line-height: 1.4 !important;
      }
      
      .download-optimized table {
        width: 100% !important;
        border-collapse: collapse !important;
        border: 3px solid #000 !important;
        margin: 10px 0 !important;
        table-layout: fixed !important;
      }
      
      .download-optimized th,
      .download-optimized td {
        border: 2px solid #000 !important;
        padding: 10px 6px !important;
        text-align: center !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        vertical-align: middle !important;
        word-wrap: break-word !important;
        background: white !important;
        color: black !important;
        height: auto !important;
        min-height: 32px !important;
        white-space: normal !important;
      }
      
      .download-optimized th {
        background: #e0e0e0 !important;
        font-weight: bold !important;
        font-size: 15px !important;
      }

      .download-optimized .bg-gray-100 td,
      .download-optimized .bg-blue-50 td {
        font-size: 16px !important;
        font-weight: bold !important;
        background: #e0e0e0 !important;
        color: #000 !important;
      }

      .download-optimized .bg-gray-100 td:nth-child(2),
      .download-optimized .bg-gray-100 td:nth-child(4),
      .download-optimized .bg-gray-100 td:nth-child(6),
      .download-optimized .bg-blue-50 td:nth-child(2),
      .download-optimized .bg-blue-50 td:nth-child(4),
      .download-optimized .bg-blue-50 td:nth-child(6) {
        font-size: 28px !important;
        font-weight: 900 !important;
        color: #000 !important;
      }
      
      .download-optimized td[colspan="7"] {
        font-size: 26px !important;
        font-weight: 900 !important;
        padding: 15px !important;
      }

      .download-optimized .text-lg {
        font-size: 22px !important;
        font-weight: 900 !important;
      }
      
      /* Select 드롭다운 요소를 텍스트로 변환 */
      .download-optimized select,
      .download-optimized button[role="combobox"],
      .download-optimized [data-radix-select-trigger] {
        appearance: none !important;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        padding: 6px !important;
        font-size: 13px !important;
        font-weight: bold !important;
        color: black !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        line-height: 1.3 !important;
      }
      
      .download-optimized select:after,
      .download-optimized select:before,
      .download-optimized button[role="combobox"]:after,
      .download-optimized button[role="combobox"]:before,
      .download-optimized [data-radix-select-trigger]:after,
      .download-optimized [data-radix-select-trigger]:before,
      .download-optimized [data-radix-select-icon],
      .download-optimized svg {
        display: none !important;
        visibility: hidden !important;
      }
      
      .download-optimized * { color: #000 !important; }
    `;

    // Select 요소를 텍스트로 변환
    const selectElements = clonedElement.querySelectorAll('select, button[role="combobox"], [data-radix-select-trigger]');
    selectElements.forEach(select => {
      const value = getElementValue(select);
      const textSpan = clonedDoc.createElement('span');
      textSpan.textContent = value;
      textSpan.style.cssText = `
        font-size: 13px !important;
        font-weight: bold !important;
        color: #000 !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        padding: 4px !important;
        line-height: 1.3 !important;
      `;

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    clonedDoc.head.appendChild(style);
  };

  // 🔥 인쇄 함수 (데스크톱용) - 인쇄용 CSS 적용
  const handlePrint = () => {
    const element = document.getElementById(targetElementId);
    if (!element) return;

    // 🔥 인쇄용 임시 스타일 추가
    const printStyle = document.createElement('style');
    printStyle.id = 'temp-print-style';
    printStyle.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        
        #${targetElementId}, #${targetElementId} * {
          visibility: visible;
        }
        
        #${targetElementId} {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 10mm !important;
          font-size: 12px !important;
          background: white !important;
          color: black !important;
        }

        #${targetElementId} table {
          width: 100% !important;
          border-collapse: collapse !important;
          border: 2px solid #000 !important;
          margin: 5mm 0 !important;
          page-break-inside: auto !important;
          table-layout: fixed !important;
        }

        #${targetElementId} th,
        #${targetElementId} td {
          border: 1px solid #000 !important;
          padding: 3mm 2mm !important;
          text-align: center !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
          vertical-align: middle !important;
          word-wrap: break-word !important;
          background: white !important;
          color: black !important;
          page-break-inside: avoid !important;
        }

        #${targetElementId} th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
          font-size: 12px !important;
        }

        #${targetElementId} tbody tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }

        /* 🔥 15행마다 페이지 분할 */
        #${targetElementId} tbody tr:nth-child(15n) {
          page-break-after: page !important;
        }

        /* Select 요소 숨김 */
        #${targetElementId} select,
        #${targetElementId} button[role="combobox"],
        #${targetElementId} [data-radix-select-trigger] {
          display: none !important;
        }

        /* Select 값을 텍스트로 표시 */
        #${targetElementId} select::after,
        #${targetElementId} button[role="combobox"]::after,
        #${targetElementId} [data-radix-select-trigger]::after {
          content: attr(aria-label) !important;
          display: block !important;
          font-size: 11px !important;
          color: black !important;
          text-align: center !important;
       }

       /* 편집 관련 요소 숨김 */
       #${targetElementId} .no-print,
       #${targetElementId} button:not([role="combobox"]),
       #${targetElementId} .bg-blue-50.p-3,
       #${targetElementId} .bg-orange-50 {
         display: none !important;
       }

       /* 합계 행 스타일 */
       #${targetElementId} .bg-gray-100 td,
       #${targetElementId} .bg-blue-50 td {
         background: #e0e0e0 !important;
         font-weight: bold !important;
       }

       /* 제목 및 정보 영역 */
       #${targetElementId} .text-lg {
         font-size: 16px !important;
         font-weight: bold !important;
       }

       #${targetElementId} .text-xl {
         font-size: 18px !important;
         font-weight: bold !important;
       }

       /* 청구서 제목 */
       #${targetElementId} td[colspan="7"] {
         font-size: 20px !important;
         font-weight: bold !important;
         padding: 5mm !important;
       }
     }
   `;

    document.head.appendChild(printStyle);

    // 🔥 Select 요소의 값을 텍스트로 변환
    const selectElements = element.querySelectorAll('select, button[role="combobox"], [data-radix-select-trigger]');
    const originalElements: { element: Element; originalHTML: string; }[] = [];

    selectElements.forEach(select => {
      const value = getElementValue(select);
      originalElements.push({
        element: select,
        originalHTML: select.outerHTML
      });

      // 임시 텍스트 요소로 교체
      const textSpan = document.createElement('span');
      textSpan.textContent = value;
      textSpan.style.cssText = `
       font-size: 11px !important;
       font-weight: bold !important;
       color: black !important;
       text-align: center !important;
       display: block !important;
       width: 100% !important;
       padding: 2px !important;
       line-height: 1.3 !important;
     `;
      textSpan.setAttribute('data-print-text', 'true');

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    // 인쇄 실행
    setTimeout(() => {
      window.print();

      // 🔥 인쇄 후 원래 상태로 복원
      setTimeout(() => {
        // 임시 스타일 제거
        const tempStyle = document.getElementById('temp-print-style');
        if (tempStyle) {
          tempStyle.remove();
        }

        // Select 요소 복원
        const printTextElements = element.querySelectorAll('[data-print-text="true"]');
        printTextElements.forEach((textElement, index) => {
          if (originalElements[index] && textElement.parentNode) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalElements[index].originalHTML;
            const restoredElement = tempDiv.firstChild;
            if (restoredElement) {
              textElement.parentNode.replaceChild(restoredElement, textElement);
            }
          }
        });
      }, 1000);
    }, 100);

    setIsDialogOpen(false);
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={downloading}
          className="no-print"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? '처리 중...' : showText ? '다운로드' : ''}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">다운로드 옵션</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Button
                onClick={downloadAsMultipleImages}
                disabled={downloading}
                className="w-full justify-start"
              >
                <Image className="h-4 w-4 mr-2" />
                PNG 이미지로 다운로드
              </Button>
              <Button
                onClick={downloadAsPDF}
                disabled={downloading}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF로 다운로드 (권장)
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                취소
              </Button>
            </div>
            {downloading && (
              <div className="text-center py-4">
                <div className="animate-spin inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-2 text-gray-500 text-sm">
                  다운로드 처리 중...
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 🔥 데스크톱에서는 인쇄, PNG, PDF 모두 지원
  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="no-print"
        >
          <Printer className="h-4 w-4 mr-2" />
          {showText ? '인쇄' : ''}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={downloading}
          className="no-print"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? '처리 중...' : showText ? '다운로드' : ''}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">다운로드 옵션</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              onClick={downloadAsMultipleImages}
              disabled={downloading}
              className="w-full justify-start"
            >
              <Image className="h-4 w-4 mr-2" />
              PNG 이미지로 다운로드
            </Button>
            <Button
              onClick={downloadAsPDF}
              disabled={downloading}
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF로 다운로드 (권장)
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-full"
            >
              취소
            </Button>
          </div>
          {downloading && (
            <div className="text-center py-4">
              <div className="animate-spin inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-500 text-sm">
                다운로드 처리 중...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportDownloader;
