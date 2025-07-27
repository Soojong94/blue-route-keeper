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

// 헬퍼 함수 정의
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

  // 항상 단일 페이지로 강제 (다중 페이지 로직 비활성화)
  const getTableRowCount = (element: HTMLElement): number => {
    return 0;
  };

  // 보고서 타입 확인 함수
  const getReportType = (element: HTMLElement): { isInvoice: boolean; isMobile: boolean } => {
    const isInvoice = element.classList.contains('invoice-container') ||
      element.querySelector('.invoice-container') !== null;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    return { isInvoice, isMobile };
  };

  // PNG 다운로드 - 항상 단일 이미지로 처리
  const downloadAsMultipleImages = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      await downloadSingleImage(element);

      toast({
        title: "다운로드 완료",
        description: "PNG 이미지가 다운로드되었습니다.",
      });

    } catch (error) {
      console.error('Image download error:', error);
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

  // 단일 이미지 다운로드
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

  // 🔥 PNG 이미지용 스타일 - 가시성 대폭 개선
  const applyImageStyles = (clonedDoc: Document, clonedElement: HTMLElement) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      .download-optimized {
        background: white !important;
        color: black !important;
        font-family: Arial, sans-serif !important;
        padding: 16px !important;
        width: 1000px !important;
        max-width: none !important;
        margin: 0 !important;
        font-size: 12px !important;
        line-height: 1.5 !important;
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
        line-height: 1.5 !important;
        vertical-align: top !important;
        word-wrap: break-word !important;
        background: white !important;
        color: black !important;
        height: auto !important;
        min-height: 32px !important;
        white-space: normal !important;
        box-sizing: border-box !important;
        position: relative !important;
        display: table-cell !important;
      }
      
      .download-optimized th {
        background: #e0e0e0 !important;
        font-weight: bold !important;
        font-size: 13px !important;
        padding: 10px 4px !important;
      }

      /* 🔥 셀 내부 텍스트 정렬을 위한 wrapper */
      .download-optimized td > *,
      .download-optimized th > * {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin: 0 !important;
        padding: 4px 0 !important;
        line-height: 1.4 !important;
      }

      /* 🔥 청구서 제목 - 대폭 확대 */
      .download-optimized td[colspan="7"] {
        font-size: 32px !important;
        font-weight: 900 !important;
        padding: 20px 8px !important;
        line-height: 1.3 !important;
        background: #f0f8ff !important;
      }

      /* 🔥 청구서 현장 정보 테이블 대폭 개선 */
      .download-optimized > div:first-child table td,
      .download-optimized > div:first-child table th {
        padding: 14px 8px !important;
        line-height: 1.4 !important;
        vertical-align: middle !important;
      }

      /* 🔥 청구서 현장 정보 헤더 (라벨들) */
      .download-optimized > div:first-child table .bg-gray-100 {
        background: #e6f3ff !important;
        font-size: 16px !important;
        font-weight: bold !important;
        color: #000 !important;
      }

      /* 🔥 청구서 현장 정보 데이터 */
      .download-optimized > div:first-child table td:not(.bg-gray-100) {
        font-size: 14px !important;
        font-weight: 600 !important;
        background: white !important;
      }

      /* 🔥 운행보고서 상단 정보 라인 강화 */
      .download-optimized .bg-blue-50 {
        background: #e6f3ff !important;
        font-size: 16px !important;
        font-weight: bold !important;
        padding: 12px 8px !important;
        color: #000 !important;
      }

      /* 🔥 합계 행 - 청구서와 운행보고서 공통 */
      .download-optimized .bg-gray-100 td,
      .download-optimized .bg-white td,
      .download-optimized .bg-blue-100 td {
        background: #fff9e6 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        padding: 14px 6px !important;
        color: #000 !important;
      }

      /* 🔥 합계 행의 숫자 (총 횟수, 총액) - 더욱 크게 */
      .download-optimized .bg-gray-100 td:nth-child(2),
      .download-optimized .bg-gray-100 td:nth-child(4),
      .download-optimized .bg-gray-100 td:nth-child(6),
      .download-optimized .bg-gray-100 td:nth-child(7),
      .download-optimized .bg-white td:nth-child(2),
      .download-optimized .bg-white td:nth-child(4),
      .download-optimized .bg-white td:nth-child(6),
      .download-optimized .bg-white td:nth-child(7),
      .download-optimized .bg-blue-100 td:nth-child(2),
      .download-optimized .bg-blue-100 td:nth-child(4),
      .download-optimized .bg-blue-100 td:nth-child(6),
      .download-optimized .bg-blue-100 td:nth-child(7) {
        font-size: 28px !important;
        font-weight: 900 !important;
        color: #000 !important;
        padding: 16px 6px !important;
        background: #fff2cc !important;
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
        line-height: 1.4 !important;
        margin: 0 !important;
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
      
      .download-optimized .text-lg { 
        font-size: 18px !important; 
        font-weight: bold !important; 
        padding: 8px 0 !important;
      }
      .download-optimized .text-xl { 
        font-size: 22px !important; 
        font-weight: bold !important; 
        padding: 10px 0 !important;
      }
      
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
        font-size: 12px !important;
        font-weight: bold !important;
        color: #000 !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        padding: 4px 0 !important;
        line-height: 1.4 !important;
        margin: 0 !important;
      `;

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    clonedDoc.head.appendChild(style);
  };

  // PDF 다운로드 - 항상 단일 페이지로 처리
  const downloadAsPDF = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      await downloadSinglePagePDF(element);

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

  // 단일 페이지 PDF
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

  // 🔥 PDF용 스타일 - 가시성 대폭 개선
  const applyPDFStyles = (
    clonedDoc: Document,
    clonedElement: HTMLElement
  ) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      .download-optimized {
        background: white !important;
        color: black !important;
        font-family: Arial, sans-serif !important;
        padding: 20px !important;
        width: 1200px !important;
        max-width: none !important;
        margin: 0 !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
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
        line-height: 1.5 !important;
        vertical-align: top !important;
        word-wrap: break-word !important;
        background: white !important;
        color: black !important;
        height: auto !important;
        min-height: 36px !important;
        white-space: normal !important;
        box-sizing: border-box !important;
        position: relative !important;
        display: table-cell !important;
      }
      
      .download-optimized th {
        background: #e0e0e0 !important;
        font-weight: bold !important;
        font-size: 15px !important;
        padding: 12px 6px !important;
      }

      /* 🔥 셀 내부 텍스트 정렬을 위한 wrapper */
      .download-optimized td > *,
      .download-optimized th > * {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin: 0 !important;
        padding: 6px 0 !important;
        line-height: 1.4 !important;
      }

      /* 🔥 청구서 제목 - 대폭 확대 */
      .download-optimized td[colspan="7"] {
        font-size: 36px !important;
        font-weight: 900 !important;
        padding: 24px 12px !important;
        line-height: 1.3 !important;
        background: #f0f8ff !important;
      }

      /* 🔥 청구서 현장 정보 테이블 대폭 개선 */
      .download-optimized > div:first-child table td,
      .download-optimized > div:first-child table th {
        padding: 16px 10px !important;
        line-height: 1.4 !important;
        vertical-align: middle !important;
      }

      /* 🔥 청구서 현장 정보 헤더 (라벨들) */
      .download-optimized > div:first-child table .bg-gray-100 {
        background: #e6f3ff !important;
        font-size: 18px !important;
        font-weight: bold !important;
        color: #000 !important;
      }

      /* 🔥 청구서 현장 정보 데이터 */
      .download-optimized > div:first-child table td:not(.bg-gray-100) {
        font-size: 16px !important;
        font-weight: 600 !important;
        background: white !important;
      }

      /* 🔥 운행보고서 상단 정보 라인 강화 */
      .download-optimized .bg-blue-50 {
        background: #e6f3ff !important;
        font-size: 18px !important;
        font-weight: bold !important;
        padding: 14px 10px !important;
        color: #000 !important;
      }

      /* 🔥 합계 행 - 청구서와 운행보고서 공통 */
      .download-optimized .bg-gray-100 td,
      .download-optimized .bg-white td,
      .download-optimized .bg-blue-100 td {
        background: #fff9e6 !important;
        font-size: 20px !important;
        font-weight: bold !important;
        padding: 16px 8px !important;
        color: #000 !important;
      }

      /* 🔥 합계 행의 숫자 (총 횟수, 총액) - 더욱 크게 */
      .download-optimized .bg-gray-100 td:nth-child(2),
      .download-optimized .bg-gray-100 td:nth-child(4),
      .download-optimized .bg-gray-100 td:nth-child(6),
      .download-optimized .bg-gray-100 td:nth-child(7),
      .download-optimized .bg-white td:nth-child(2),
      .download-optimized .bg-white td:nth-child(4),
      .download-optimized .bg-white td:nth-child(6),
      .download-optimized .bg-white td:nth-child(7),
      .download-optimized .bg-blue-100 td:nth-child(2),
      .download-optimized .bg-blue-100 td:nth-child(4),
      .download-optimized .bg-blue-100 td:nth-child(6),
      .download-optimized .bg-blue-100 td:nth-child(7) {
        font-size: 32px !important;
        font-weight: 900 !important;
        color: #000 !important;
        padding: 20px 8px !important;
        background: #fff2cc !important;
      }

      .download-optimized .text-lg {
        font-size: 22px !important;
        font-weight: 900 !important;
        padding: 12px 0 !important;
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
        font-size: 14px !important;
        font-weight: bold !important;
        color: black !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        line-height: 1.4 !important;
        margin: 0 !important;
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
        font-size: 14px !important;
        font-weight: bold !important;
        color: #000 !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        padding: 6px 0 !important;
        line-height: 1.4 !important;
        margin: 0 !important;
      `;

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    clonedDoc.head.appendChild(style);
  };

  // 인쇄 함수 (데스크톱용) - 인쇄용 CSS 적용
  const handlePrint = () => {
    const element = document.getElementById(targetElementId);
    if (!element) return;

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
          margin: 4mm 0 !important;
          page-break-inside: auto !important;
          table-layout: fixed !important;
        }

        #${targetElementId} th,
        #${targetElementId} td {
          border: 1px solid #000 !important;
          padding: 4mm 2mm !important;
          text-align: center !important;
          font-size: 10px !important;
          line-height: 1.4 !important;
          vertical-align: top !important;
          word-wrap: break-word !important;
          background: white !important;
          color: black !important;
          page-break-inside: avoid !important;
          box-sizing: border-box !important;
        }

        #${targetElementId} th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
          font-size: 11px !important;
          padding: 5mm 2mm !important;
        }

        /* 🔥 인쇄용 합계 행 강화 */
        #${targetElementId} .bg-gray-100 td,
        #${targetElementId} .bg-white td,
        #${targetElementId} .bg-blue-100 td {
          background: #f0f0f0 !important;
          font-weight: bold !important;
          padding: 6mm 2mm !important;
          font-size: 12px !important;
        }

        #${targetElementId} .bg-gray-100 td:nth-child(2),
        #${targetElementId} .bg-gray-100 td:nth-child(4),
        #${targetElementId} .bg-gray-100 td:nth-child(6),
        #${targetElementId} .bg-gray-100 td:nth-child(7),
        #${targetElementId} .bg-white td:nth-child(2),
        #${targetElementId} .bg-white td:nth-child(4),
        #${targetElementId} .bg-white td:nth-child(6),
        #${targetElementId} .bg-white td:nth-child(7),
        #${targetElementId} .bg-blue-100 td:nth-child(2),
        #${targetElementId} .bg-blue-100 td:nth-child(4),
        #${targetElementId} .bg-blue-100 td:nth-child(6),
        #${targetElementId} .bg-blue-100 td:nth-child(7) {
          font-size: 16px !important;
          font-weight: 900 !important;
          background: #e8e8e8 !important;
        }

        #${targetElementId} td[colspan="7"] {
          font-size: 20px !important;
          font-weight: bold !important;
          padding: 6mm !important;
          background: #f8f8f8 !important;
        }

        /* Select 요소 숨김 */
        #${targetElementId} select,
        #${targetElementId} button[role="combobox"],
        #${targetElementId} [data-radix-select-trigger] {
          display: none !important;
        }

        /* 편집 관련 요소 숨김 */
        #${targetElementId} .no-print,
        #${targetElementId} button:not([role="combobox"]),
        #${targetElementId} .bg-blue-50.p-3,
        #${targetElementId} .bg-orange-50 {
          display: none !important;
        }

        #${targetElementId} .text-lg {
          font-size: 16px !important;
          font-weight: bold !important;
        }

        #${targetElementId} .text-xl {
          font-size: 18px !important;
          font-weight: bold !important;
        }
      }
    `;

    document.head.appendChild(printStyle);

    const selectElements = element.querySelectorAll('select, button[role="combobox"], [data-radix-select-trigger]');
    const originalElements: { element: Element; originalHTML: string; }[] = [];

    selectElements.forEach(select => {
      const value = getElementValue(select);
      originalElements.push({
        element: select,
        originalHTML: select.outerHTML
      });

      const textSpan = document.createElement('span');
      textSpan.textContent = value;
      textSpan.style.cssText = `
        font-size: 10px !important;
        font-weight: bold !important;
        color: black !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        padding: 2mm 0 !important;
        line-height: 1.3 !important;
      `;
      textSpan.setAttribute('data-print-text', 'true');

      if (select.parentNode) {
        select.parentNode.replaceChild(textSpan, select);
      }
    });

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        const tempStyle = document.getElementById('temp-print-style');
        if (tempStyle) {
          tempStyle.remove();
        }

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

  // 데스크톱에서는 인쇄, PNG, PDF 모두 지원
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
