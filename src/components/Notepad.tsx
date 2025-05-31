import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveNote, getNotes, updateNote, deleteNote, Note } from '@/utils/noteStorage';
import GridEditor from '@/components/notepad/GridEditor';
import NoteList from '@/components/notepad/NoteList';
import ExportDialog from '@/components/notepad/ExportDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useLocalStorage<string | null>('selectedNoteId', null);
  const [noteData, setNoteData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find(note => note.id === selectedNoteId);
      if (selectedNote) {
        setNoteData(selectedNote.content || []);
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedNoteId, notes]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await getNotes();
      setNotes(notesData);

      // 첫 번째 메모 자동 선택 또는 새 메모 생성
      if (notesData.length === 0) {
        await createNewNote();
      } else if (!selectedNoteId || !notesData.find(n => n.id === selectedNoteId)) {
        setSelectedNoteId(notesData[0].id);
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

  const createNewNote = async () => {
    try {
      const noteCount = notes.length;
      const newNote = await saveNote({
        title: `새 메모 #${noteCount + 1}`,
        content: Array(20).fill(null).map(() =>
          Array(10).fill(null).map(() => ({ value: '' }))
        )
      });

      setNotes(prev => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setHasUnsavedChanges(false);

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

  const saveCurrentNote = async () => {
    if (!selectedNoteId || !hasUnsavedChanges) return;

    try {
      setLoading(true);
      await updateNote(selectedNoteId, { content: noteData });
      setHasUnsavedChanges(false);
      await loadNotes();

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
      setLoading(false);
    }
  };

  const handleDataChange = useCallback((newData: any[][]) => {
    setNoteData(newData);
    setHasUnsavedChanges(true);
  }, []);

  const handleSelectNote = (noteId: string) => {
    if (hasUnsavedChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
        setSelectedNoteId(noteId);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedNoteId(noteId);
    }
  };

  const handleRenameNote = async (noteId: string, newTitle: string) => {
    try {
      await updateNote(noteId, { title: newTitle });
      await loadNotes();

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
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);

      const remainingNotes = notes.filter(note => note.id !== noteId);
      setNotes(remainingNotes);

      if (selectedNoteId === noteId) {
        if (remainingNotes.length > 0) {
          setSelectedNoteId(remainingNotes[0].id);
        } else {
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
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Edit3 className="h-4 w-4" />
            메모장
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* 메모 목록 및 컨트롤 */}
          <NoteList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={createNewNote}
            onRenameNote={handleRenameNote}
            onDeleteNote={handleDeleteNote}
          />

          {/* 현재 메모 정보 및 저장 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-600">
              현재: "{selectedNote?.title || '메모 없음'}"
              {hasUnsavedChanges && <span className="text-orange-500 ml-2">● 저장되지 않음</span>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportDialogOpen(true)}
                className="text-xs h-7 px-2"
                disabled={!selectedNote}
              >
                <Download className="h-3 w-3 mr-1" />
                내보내기
              </Button>
              <Button
                onClick={saveCurrentNote}
                size="sm"
                className="text-xs h-7 px-2"
                disabled={!hasUnsavedChanges || loading}
              >
                <Save className="h-3 w-3 mr-1" />
                {loading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>

          {/* 그리드 에디터 */}
          {selectedNote && (
            <GridEditor
              data={noteData}
              onDataChange={handleDataChange}
              rows={20}
              cols={10}
            />
          )}

          {!selectedNote && (
            <div className="text-center py-8 text-gray-500 text-xs">
              메모를 선택하거나 새로 생성해주세요.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 내보내기 다이얼로그 */}
      {selectedNote && (
        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          noteTitle={selectedNote.title}
          noteData={noteData}
        />
      )}
    </div>
  );
};

export default Notepad;