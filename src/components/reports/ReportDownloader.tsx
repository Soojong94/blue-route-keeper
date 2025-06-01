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
        scale: 3, // 높은 해상도
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        scrollX: 0,
        scrollY: 0,
        foreignObjectRendering: false,
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          // 🔥 클론된 요소에 다운로드 최적화 스타일 적용
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
            
            /* 월간보고서 컬럼 너비 */
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(1),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(1) { width: 100px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(2),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(2) { width: 200px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(3),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(3) { width: 80px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(4),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(4) { width: 120px !important; }
            .download-optimized table[style*="table-layout: fixed"] th:nth-child(5),
            .download-optimized table[style*="table-layout: fixed"] td:nth-child(5) { width: 120px !important; }
            
            .download-optimized .text-lg { font-size: 18px !important; font-weight: bold !important; }
            .download-optimized .text-xl { font-size: 20px !important; font-weight: bold !important; }
            
            .download-optimized .bg-blue-50,
            .download-optimized .bg-green-50,
            .download-optimized .bg-red-50,
            .download-optimized .bg-gray-50 {
              background: #f8f8f8 !important;
              border: 1px solid #ccc !important;
              padding: 8px !important;
              margin: 4px 0 !important;
            }
            
            .download-optimized * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
            
            /* 색상 통일 */
            .download-optimized .text-blue-600,
            .download-optimized .text-blue-700,
            .download-optimized .text-blue-800,
            .download-optimized .text-green-600,
            .download-optimized .text-green-700,
            .download-optimized .text-green-800,
            .download-optimized .text-red-600,
            .download-optimized .text-red-700,
            .download-optimized .text-red-800 {
              color: #000 !important;
            }
          `;
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

      // 이미지 생성과 동일한 방식으로 처리
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
        onclone: (clonedDoc) => {
          // PDF용 동일한 스타일 적용
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
            
            .download-optimized .text-lg { font-size: 20px !important; font-weight: bold !important; }
            .download-optimized .text-xl { font-size: 22px !important; font-weight: bold !important; }
            
            .download-optimized * { color: #000 !important; }
          `;
          clonedDoc.head.appendChild(style);
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