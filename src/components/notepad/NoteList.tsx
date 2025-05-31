import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Note {
  id: string;
  title: string;
  content: any[][];
  created_at: string;
  updated_at: string | null;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onRenameNote,
  onDeleteNote
}) => {
  const handleRename = (note: Note) => {
    const newTitle = prompt('새 제목을 입력하세요:', note.title);
    if (newTitle && newTitle !== note.title) {
      onRenameNote(note.id, newTitle);
    }
  };

  const handleDelete = (note: Note) => {
    if (confirm(`"${note.title}" 메모를 정말로 삭제하시겠습니까?`)) {
      onDeleteNote(note.id);
    }
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs text-gray-600 shrink-0">메모 목록:</span>

      <div className="flex-1 max-w-xs">
        <Select value={selectedNoteId || ''} onValueChange={onSelectNote}>
          <SelectTrigger className="text-xs h-7">
            <SelectValue placeholder="메모를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {notes.map((note) => (
              <SelectItem key={note.id} value={note.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  <span>{note.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1">
                    {format(new Date(note.updated_at || note.created_at), 'MM/dd')}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onCreateNote}
        className="text-xs h-7 px-2 shrink-0"
      >
        새 메모
      </Button>

      {selectedNote && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRename(selectedNote)}
            className="text-xs h-7 w-7 p-0 text-blue-500 hover:text-blue-700"
            title="이름 변경"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(selectedNote)}
            className="text-xs h-7 w-7 p-0 text-red-500 hover:text-red-700"
            title="삭제"
            disabled={notes.length <= 1}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};

export default NoteList;