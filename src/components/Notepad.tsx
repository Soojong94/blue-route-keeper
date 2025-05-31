/* src/components/Notepad.tsx 수정 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Download, Plus, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveNote, getNotes, updateNote, deleteNote, Note } from '@/utils/noteStorage';
import GridEditor from '@/components/notepad/GridEditor';
import ExportDialog from '@/components/notepad/ExportDialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentNoteData, setCurrentNoteData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // 자동 저장을 위한 ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasUnsavedChangesRef = useRef(false);

  const { toast } = useToast();

  // 빈 그리드 데이터 생성 (10행 5열로 변경)
  const getEmptyGrid = useCallback(() => {
    return Array(10).fill(null).map(() =>
      Array(5).fill(null).map(() => ({ value: '' }))
    );
  }, []);

  // 깊은 복사 함수
  const deepCopy = useCallback((data: any[][]) => {
    return JSON.parse(JSON.stringify(data));
  }, []);

  useEffect(() => {
    loadNotes();
  }, []);

  // 컴포넌트 언마운트 시 자동 저장 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await getNotes();
      setNotes(notesData);

      // 메모가 없으면 자동으로 새 메모 생성
      if (notesData.length === 0) {
        await createNewNote();
      } else {
        selectNote(notesData[0].id);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "로드 실패",
        description: "메모를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNoteId(noteId);
      // 완전히 새로운 데이터 객체 생성
      const noteContent = note.content && note.content.length > 0 ? note.content : getEmptyGrid();
      const newData = deepCopy(noteContent);
      setCurrentNoteData(newData);
      hasUnsavedChangesRef.current = false;
      // 데이터 버전 증가로 강제 리렌더링
      setDataVersion(prev => prev + 1);
    }
  }, [notes, getEmptyGrid, deepCopy]);

  const createNewNote = async () => {
    try {
      const noteCount = notes.length;
      const emptyGrid = getEmptyGrid();
      const newNote = await saveNote({
        title: `새 메모 #${noteCount + 1}`,
        content: emptyGrid
      });

      setNotes(prev => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      // 완전히 새로운 빈 그리드 생성
      const newData = deepCopy(emptyGrid);
      setCurrentNoteData(newData);
      hasUnsavedChangesRef.current = false;
      setDataVersion(prev => prev + 1);

      toast({
        title: "메모 생성",
        description: "새 메모가 생성되었습니다.",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "생성 실패",
        description: "메모 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 자동 저장 함수
  const autoSave = useCallback(async () => {
    if (!selectedNoteId || !hasUnsavedChangesRef.current || isSaving) return;

    try {
      setIsSaving(true);
      await updateNote(selectedNoteId, { content: deepCopy(currentNoteData) });
      hasUnsavedChangesRef.current = false;

      // 메모 목록 새로고침 (조용히)
      const updatedNotes = await getNotes();
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Auto save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedNoteId, currentNoteData, deepCopy, isSaving]);

  // 수동 저장 함수 (저장 버튼용)
  const manualSave = async () => {
    if (!selectedNoteId || !hasUnsavedChangesRef.current) {
      toast({
        title: "저장 완료",
        description: "저장할 변경사항이 없습니다.",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateNote(selectedNoteId, { content: deepCopy(currentNoteData) });
      hasUnsavedChangesRef.current = false;

      const updatedNotes = await getNotes();
      setNotes(updatedNotes);

      toast({
        title: "저장 완료",
        description: "메모가 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "저장 실패",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 데이터 변경 처리 - 자동 저장 트리거
  const handleDataChange = useCallback((newData: any[][]) => {
    const freshData = deepCopy(newData);
    setCurrentNoteData(freshData);
    hasUnsavedChangesRef.current = true;

    // 기존 타이머 취소
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // 2초 후 자동 저장 (디바운싱)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);
  }, [deepCopy, autoSave]);

  const handleSelectNote = (noteId: string) => {
    if (hasUnsavedChangesRef.current) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
        // 현재 메모 자동 저장 후 이동
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSave().finally(() => {
          selectNote(noteId);
        });
      }
    } else {
      selectNote(noteId);
    }
  };

  const handleRenameNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const newTitle = prompt('새 제목을 입력하세요:', note.title);
    if (newTitle && newTitle !== note.title) {
      try {
        await updateNote(noteId, { title: newTitle });
        const updatedNotes = await getNotes();
        setNotes(updatedNotes);

        toast({
          title: "이름 변경 완료",
          description: "메모 제목이 변경되었습니다.",
        });
      } catch (error) {
        console.error('Error renaming note:', error);
        toast({
          title: "이름 변경 실패",
          description: "메모 제목 변경 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (confirm(`"${note.title}" 메모를 정말로 삭제하시겠습니까?`)) {
      try {
        await deleteNote(noteId);

        const remainingNotes = notes.filter(note => note.id !== noteId);
        setNotes(remainingNotes);

        if (selectedNoteId === noteId) {
          if (remainingNotes.length > 0) {
            selectNote(remainingNotes[0].id);
          } else {
            // 메모가 0개가 되면 새 메모 자동 생성
            await createNewNote();
          }
        }

        toast({
          title: "삭제 완료",
          description: "메모가 삭제되었습니다.",
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        toast({
          title: "삭제 실패",
          description: "메모 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            메모장
            {isSaving && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">자동 저장 중...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 왼쪽: 메모 목록 */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">메모 목록</h3>
                <Button
                  onClick={createNewNote}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  새 메모
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-colors ${selectedNoteId === note.id
                      ? 'bg-purple-50 border-purple-200'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1"
                          onClick={() => handleSelectNote(note.id)}
                        >
                          <h4 className="font-medium text-sm">{note.title}</h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(note.updated_at || note.created_at), 'MM/dd HH:mm')}
                          </p>
                        </div>

                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameNote(note.id);
                            }}
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 오른쪽: 메모 편집기 */}
            <div className="lg:col-span-3">
              {/* 현재 메모 정보 및 버튼들 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">
                    {selectedNote?.title || '메모 없음'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChangesRef.current && !isSaving && (
                      <span className="text-xs text-orange-500">● 자동 저장 대기 중</span>
                    )}
                    {isSaving && (
                      <span className="text-xs text-blue-500">● 저장 중...</span>
                    )}
                    {!hasUnsavedChangesRef.current && !isSaving && (
                      <span className="text-xs text-green-500">● 저장됨</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExportDialogOpen(true)}
                    disabled={!selectedNote}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    내보내기
                  </Button>
                  <Button
                    onClick={manualSave}
                    size="sm"
                    disabled={!hasUnsavedChangesRef.current || isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? '저장 중...' : '수동 저장'}
                  </Button>
                </div>
              </div>

              {/* 자동 저장 안내 */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>자동 저장:</strong> 변경사항은 2초 후 자동으로 저장됩니다. 수동 저장 버튼으로 즉시 저장할 수도 있습니다.
                </p>
              </div>

              {/* 그리드 에디터 */}
              {selectedNote ? (
                <GridEditor
                  key={`${selectedNoteId}-${dataVersion}`}
                  data={currentNoteData}
                  onDataChange={handleDataChange}
                  rows={10} // 기본 10행
                  cols={5}  // 기본 5열
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  메모를 선택하거나 새로 생성해주세요.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내보내기 다이얼로그 */}
      {selectedNote && (
        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          noteTitle={selectedNote.title}
          noteData={currentNoteData}
        />
      )}
    </div>
  );
};

export default Notepad;