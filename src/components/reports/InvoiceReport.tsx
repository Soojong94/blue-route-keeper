// src/components/reports/InvoiceReport.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import { InvoiceReportData, InvoiceReportRow, InvoiceSiteInfo } from '@/utils/reportUtils';
import InvoiceReportGrid from './InvoiceReportGrid';

interface InvoiceReportProps {
  data: InvoiceReportData;
  viewMode?: 'edit' | 'view';
  onDataChange?: (newData: InvoiceReportData) => void;
  showTitle?: boolean;
}

const InvoiceReport: React.FC<InvoiceReportProps> = ({
  data,
  viewMode = 'edit',
  onDataChange,
  showTitle = true
}) => {
  const safeData = data || {
    title: '',
    siteInfo: {
      siteName: '',
      registrationNumber: '',
      companyName: '',
      ownerName: '',
      address: '',
      businessType: '',
      businessCategory: ''
    },
    rows: [],
    totalCount: 0,
    totalAmount: 0
  };

  const [reportData, setReportData] = useState<InvoiceReportData>(safeData);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(safeData.title || '');

  useEffect(() => {
    if (data) {
      setReportData(data);
      setEditingTitle(data.title || '');
    }
  }, [data]);

  if (!data) {
    return (
      <div className="space-y-4 p-4 bg-white invoice-container mx-auto" style={{ maxWidth: '210mm' }}>
        <div className="text-center py-8 text-gray-500">
          청구서 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  const handleRowsChange = (newRows: InvoiceReportRow[]) => {
    const totalCount = newRows.reduce((sum, row) => sum + row.count, 0);
    const totalAmount = newRows.reduce((sum, row) => sum + row.amount, 0);

    const newReportData: InvoiceReportData = {
      ...reportData,
      rows: newRows,
      totalCount,
      totalAmount
    };

    setReportData(newReportData);

    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  const handleSiteInfoChange = (field: keyof InvoiceSiteInfo, value: string) => {
    const newSiteInfo = { ...reportData.siteInfo, [field]: value };
    const newReportData = { ...reportData, siteInfo: newSiteInfo };

    setReportData(newReportData);

    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    const newReportData: InvoiceReportData = {
      ...reportData,
      title: editingTitle
    };

    setReportData(newReportData);
    setIsEditingTitle(false);

    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(reportData.title || '');
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const getTotalCount = () => {
    return reportData.rows?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;
  };

  const getTotalAmount = () => {
    return reportData.rows?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0;
  };

  return (
    <div className="space-y-4 p-4 bg-white invoice-container mx-auto" style={{ maxWidth: '210mm' }}>
      {/* 제목 - showTitle이 true일 때만 표시 */}
      {showTitle && (
        <div className="text-center border-2 border-black p-2 mb-4">
          {viewMode === 'edit' ? (
            <div className="flex items-center justify-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-xl font-bold text-center border-2 border-blue-300"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleTitleSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTitleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{reportData.title || '제목 없음'}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTitleEdit}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                    title="제목 편집"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{reportData.title || '제목 없음'}</h1>
          )}
        </div>
      )}

      {/* 현장 정보 섹션 */}
      <div className="border-2 border-black">
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium w-20">현장명</td>
              <td className="border border-black px-2 py-1 w-40">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.siteName}
                    onChange={(e) => handleSiteInfoChange('siteName', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="현장명 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.siteName}</span>
                )}
              </td>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium w-20">등록번호</td>
              <td className="border border-black px-2 py-1">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.registrationNumber}
                    onChange={(e) => handleSiteInfoChange('registrationNumber', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="등록번호 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.registrationNumber}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium">상호</td>
              <td className="border border-black px-2 py-1">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.companyName}
                    onChange={(e) => handleSiteInfoChange('companyName', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="상호 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.companyName}</span>
                )}
              </td>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium">성명</td>
              <td className="border border-black px-2 py-1">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.ownerName}
                    onChange={(e) => handleSiteInfoChange('ownerName', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="성명 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.ownerName}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium">사업장 주소</td>
              <td className="border border-black px-2 py-1" colSpan={3}>
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.address}
                    onChange={(e) => handleSiteInfoChange('address', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="사업장 주소 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.address}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-3 text-center" colSpan={4}>
                <span className="font-medium">아래와 같이 청구합니다.</span>
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium">업태</td>
              <td className="border border-black px-2 py-1">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.businessType}
                    onChange={(e) => handleSiteInfoChange('businessType', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="업태 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.businessType}</span>
                )}
              </td>
              <td className="border border-black px-2 py-1 bg-gray-100 font-medium">종목</td>
              <td className="border border-black px-2 py-1">
                {viewMode === 'edit' ? (
                  <Input
                    value={reportData.siteInfo.businessCategory}
                    onChange={(e) => handleSiteInfoChange('businessCategory', e.target.value)}
                    className="border-0 p-0 text-sm h-6"
                    placeholder="종목 입력"
                  />
                ) : (
                  <span>{reportData.siteInfo.businessCategory}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 편집 모드 안내 */}
      {viewMode === 'edit' && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <p className="text-sm text-blue-700">
            💡 <strong>편집 모드:</strong> 현장 정보와 청구서 항목을 직접 수정할 수 있습니다. 행 추가/삭제도 가능합니다.
          </p>
        </div>
      )}

      {/* 청구서 테이블 */}
      <div className="space-y-3">
        <InvoiceReportGrid
          rows={reportData.rows || []}
          onRowsChange={handleRowsChange}
          readonly={viewMode === 'view'}
        />
      </div>

      {/* 합계 행 */}
      <div className="border-2 border-black">
        <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr className="bg-gray-100">
              <td className="border border-black px-2 py-2 text-center font-bold" style={{ width: '12%' }}>
                -
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold" style={{ width: '25%' }}>
                -
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold" style={{ width: '10%' }}>
                -
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold" style={{ width: '8%' }}>
                총 횟수
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold" style={{ width: '12%' }}>
                총액
              </td>
              <td className="border border-black px-2 py-2 text-right font-bold text-lg" style={{ width: '12%' }}>
                {getTotalCount()}
              </td>
              <td className="border border-black px-2 py-2 text-right font-bold text-lg" style={{ width: '16%' }}>
                {getTotalAmount().toLocaleString()}원
              </td>
              {viewMode === 'edit' && <td className="border border-black" style={{ width: '5%' }}></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 감사 문구 */}
      <div className="text-center mt-8 text-lg font-medium">
        감사합니다.
      </div>
    </div>
  );
};

export default InvoiceReport;