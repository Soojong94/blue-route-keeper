// src/components/reports/ReportDownloader.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Image, FileText } from 'lucide-react';
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

  const downloadAsImage = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      // 🔥 다운로드용 클래스 추가
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
          // 🔥 다운로드 최적화 스타일 적용
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

     /* 🔥 합계 행 기본 스타일 - 라벨은 작게 */
.download-optimized .bg-gray-100 td,
.download-optimized .bg-blue-50 td {
  font-size: 14px !important;
  font-weight: bold !important;
  background: #e0e0e0 !important;
  color: #000 !important;
}

/* 🔥 "합계", "총횟수", "총액" 라벨은 작게 유지 */
.download-optimized .bg-gray-100 td:first-child,
.download-optimized .bg-blue-50 td:first-child,
.download-optimized .bg-gray-100 td:nth-child(3),
.download-optimized .bg-blue-50 td:nth-child(3),
.download-optimized .bg-gray-100 td:nth-child(5),
.download-optimized .bg-blue-50 td:nth-child(5) {
  font-size: 14px !important;
  font-weight: bold !important;
}

/* 🔥 숫자 셀만 크게 */
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
            /* 일간보고서 컬럼 너비 */
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(1),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(1) { width: 80px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(2),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(2) { width: 100px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(3),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(3) { width: 120px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(4),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(4) { width: 120px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(5),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(5) { width: 90px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(6),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(6) { width: 60px !important; }
            .download-optimized table:not([style*="table-layout: fixed"]) th:nth-child(7),
            .download-optimized table:not([style*="table-layout: fixed"]) td:nth-child(7) { width: 100px !important; }
            
            /* 청구서 컬럼 너비 최적화 */
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(1),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(1) { width: 80px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(2),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(2) { width: 140px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(3),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(3) { width: 90px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(4),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(4) { width: 50px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(5),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(5) { width: 100px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(6),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(6) { width: 120px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(7),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(7) { width: 70px !important; }
            
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

          // 🔥 클론된 문서에서 Select 요소를 텍스트로 변환
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
        }
      });

      // 🔥 원래 클래스 복원
      element.className = originalClasses;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = imgData;
      link.click();

      toast({
        title: "다운로드 완료",
        description: "이미지가 다운로드되었습니다.",
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

  const downloadAsPDF = async () => {
    try {
      setDownloading(true);
      const element = document.getElementById(targetElementId);

      if (!element) {
        throw new Error('요소를 찾을 수 없습니다.');
      }

      // 🔥 청구서인지 일간보고서인지 확인
      const isInvoiceReport = element.classList.contains('invoice-container') ||
        element.querySelector('.invoice-container') !== null;

      // 🔥 테이블 요소 찾기
      const tables = element.querySelectorAll('table');
      const mainTable = Array.from(tables).find(table =>
        table.querySelector('tbody') &&
        table.querySelector('tbody')?.children.length > 0
      );

      if (!mainTable) {
        // 테이블이 없으면 기존 방식으로 처리
        await downloadSinglePagePDF(element);
        return;
      }

      // 🔥 행 수에 따라 페이지 분할 여부 결정
      const tbody = mainTable.querySelector('tbody');
      const rowCount = tbody?.children.length || 0;

      // 청구서는 20행, 일간보고서는 15행 기준으로 분할
      const maxRowsPerPage = isInvoiceReport ? 20 : 15;

      if (rowCount <= maxRowsPerPage) {
        // 한 페이지로 충분하면 기존 방식
        await downloadSinglePagePDF(element);
      } else {
        // 🔥 다중 페이지 PDF 생성
        await downloadMultiPagePDF(element, mainTable, maxRowsPerPage, isInvoiceReport);
      }

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

  // 🔥 단일 페이지 PDF 다운로드
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

  // 🔥 다중 페이지 PDF 다운로드
  const downloadMultiPagePDF = async (element: HTMLElement, mainTable: Element, maxRowsPerPage: number, isInvoiceReport: boolean) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const tbody = mainTable.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.children);
    const totalPages = Math.ceil(rows.length / maxRowsPerPage);

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // 🔥 현재 페이지용 요소 생성
      const pageElement = element.cloneNode(true) as HTMLElement;
      pageElement.classList.add('download-optimized');

      // 🔥 헤더 정보 유지 (청구서의 경우)
      if (isInvoiceReport) {
        // 현장 정보는 첫 페이지에만 표시
        if (pageIndex > 0) {
          const siteInfoTables = pageElement.querySelectorAll('table');
          siteInfoTables.forEach((table, index) => {
            // 첫 번째 테이블(현장정보)는 첫 페이지 이후 숨김
            if (index === 0) {
              table.style.display = 'none';
            }
          });
        }
      }

      // 🔥 현재 페이지에 해당하는 행들만 표시
      const pageTableBody = pageElement.querySelector('tbody');
      if (pageTableBody) {
        pageTableBody.innerHTML = '';

        const startIndex = pageIndex * maxRowsPerPage;
        const endIndex = Math.min(startIndex + maxRowsPerPage, rows.length);
        const pageRows = rows.slice(startIndex, endIndex);

        pageRows.forEach(row => {
          pageTableBody.appendChild(row.cloneNode(true));
        });
      }

      // 🔥 마지막 페이지에만 합계 행 표시
      if (pageIndex < totalPages - 1) {
        // 마지막 페이지가 아니면 합계 행 숨김
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
        margin-top: 10px;
        font-weight: bold;
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
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const x = (pdfWidth - finalWidth) / 2;
      const y = 5;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    }

    pdf.save(`${filename}.pdf`);

    toast({
      title: "다운로드 완료",
      description: `PDF가 ${totalPages}페이지로 다운로드되었습니다.`,
    });
  };

  // 🔥 PDF용 스타일 적용 함수
  const applyPDFStyles = (clonedDoc: Document, clonedElement: HTMLElement, isMultiPage: boolean = false) => {
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

/* 🔥 합계 행 기본 스타일 - 라벨은 작게 */
.download-optimized .bg-gray-100 td,
.download-optimized .bg-blue-50 td {
  font-size: 16px !important;
  font-weight: bold !important;
  background: #e0e0e0 !important;
  color: #000 !important;
}

/* 🔥 "합계", "총횟수", "총액" 라벨은 작게 유지 */
.download-optimized .bg-gray-100 td:first-child,
.download-optimized .bg-blue-50 td:first-child,
.download-optimized .bg-gray-100 td:nth-child(3),
.download-optimized .bg-blue-50 td:nth-child(3),
.download-optimized .bg-gray-100 td:nth-child(5),
.download-optimized .bg-blue-50 td:nth-child(5) {
  font-size: 16px !important;
  font-weight: bold !important;
}

/* 🔥 숫자 셀만 크게 */
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
      /* 🔥 청구서 제목 크기 확대 */
      .download-optimized td[colspan="7"] {
        font-size: 26px !important;
        font-weight: 900 !important;
        padding: 15px !important;
      }

      /* 🔥 현장명 글씨 크기 확대 */
      .download-optimized .text-lg {
        font-size: 22px !important;
        font-weight: 900 !important;
      }
      
      /* 청구서 컬럼 너비 최적화 */
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(1),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(1) { width: 90px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(2),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(2) { width: 160px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(3),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(3) { width: 100px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(4),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(4) { width: 60px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(5),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(5) { width: 110px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(6),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(6) { width: 130px !important; }
      .download-optimized table[style*="table-layout: fixed"] th:nth-child(7),
      .download-optimized table[style*="table-layout: fixed"] td:nth-child(7) { width: 80px !important; }
      
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

    // 🔥 클론된 문서에서 Select 요소를 텍스트로 변환
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

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
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
                onClick={downloadAsImage}
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
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="no-print"
    >
      <Download className="h-4 w-4 mr-2" />
      {showText ? '인쇄' : ''}
    </Button>
  );
};

export default ReportDownloader;