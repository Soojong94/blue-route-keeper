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

      // 🔥 모바일에서 더 높은 해상도로 캡처
      const canvas = await html2canvas(element, {
        scale: window.innerWidth <= 768 ? 3 : 2, // 모바일에서 더 높은 스케일
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: true
      });

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

      // 🔥 모바일 PDF 생성 최적화
      const isMobile = window.innerWidth <= 768;

      const canvas = await html2canvas(element, {
        scale: isMobile ? 3 : 2, // 모바일에서 더 높은 해상도
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: true,
        // 🔥 모바일에서 테이블 렌더링 개선
        onclone: (clonedDoc) => {
          if (isMobile) {
            const tables = clonedDoc.querySelectorAll('.report-container table');
            tables.forEach(table => {
              (table as HTMLElement).style.minWidth = '400px';
              (table as HTMLElement).style.width = '100%';
              (table as HTMLElement).style.tableLayout = 'fixed';

              const cells = table.querySelectorAll('th, td');
              cells.forEach((cell, index) => {
                const cellElement = cell as HTMLElement;
                cellElement.style.border = '1px solid #000';
                cellElement.style.padding = '2px';
                cellElement.style.fontSize = '8px';
                cellElement.style.lineHeight = '1.2';
                cellElement.style.wordWrap = 'break-word';
                cellElement.style.overflow = 'visible';
                cellElement.style.whiteSpace = 'normal';
              });
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // 🔥 PDF 생성 최적화
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // 🔥 모바일에서 더 나은 비율 계산
      const ratio = Math.min(
        (pdfWidth - 10) / imgWidth,
        (pdfHeight - 10) / imgHeight
      );

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      const x = (pdfWidth - finalWidth) / 2;
      const y = 5; // 상단 여백

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