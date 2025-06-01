// src/hooks/useBackHandler.tsx - 뒤로가기 개선
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ModalState {
  id: string;
  type: 'dialog' | 'popover' | 'calendar' | 'dropdown';
  closeFn: () => void;
}

export const useBackHandler = () => {
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const [exitWarningShown, setExitWarningShown] = useState(false);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // 모달 등록
  const registerModal = useCallback((modal: ModalState) => {
    setModalStack(prev => [...prev, modal]);
    window.history.pushState({ modalId: modal.id }, '');
  }, []);

  // 모달 해제
  const unregisterModal = useCallback((modalId: string) => {
    setModalStack(prev => prev.filter(modal => modal.id !== modalId));
  }, []);

  // 최상위 모달 닫기
  const closeTopModal = useCallback(() => {
    const topModal = modalStack[modalStack.length - 1];
    if (topModal) {
      topModal.closeFn();
      setModalStack(prev => prev.slice(0, -1));
      return true;
    }
    return false;
  }, [modalStack]);

  // 📱 개선된 메인 탭 종료 처리 - 두 번 눌러야 종료
  const handleMainTabExit = useCallback(() => {
    if (exitWarningShown) {
      // 두 번째 뒤로가기 - 실제 종료 허용
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      setExitWarningShown(false);
      // 브라우저 뒤로가기 허용하여 앱 종료
      return;
    }

    // 첫 번째 뒤로가기 - 경고 표시
    setExitWarningShown(true);
    toast({
      title: "앱 종료",
      description: "한 번 더 뒤로가기를 누르면 앱을 종료합니다",
      duration: 2000,
    });

    // 히스토리에 더미 상태 추가하여 뒤로가기 가능하게 함
    window.history.pushState({ exitWarning: true }, '');

    // 2초 후 경고 상태 해제
    exitTimerRef.current = setTimeout(() => {
      setExitWarningShown(false);
    }, 2000);
  }, [exitWarningShown, toast]);

  // popstate 이벤트 리스너
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 모달이 열려있으면 모달 닫기 우선
      if (modalStack.length > 0) {
        event.preventDefault();
        closeTopModal();
        return;
      }

      // 종료 경고 상태가 아니면 첫 번째 뒤로가기 처리
      if (!exitWarningShown) {
        event.preventDefault();
        handleMainTabExit();
        return;
      }

      // 두 번째 뒤로가기면 실제 종료 허용
      // 추가 처리 없이 브라우저가 자연스럽게 처리하도록 함
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [modalStack, closeTopModal, handleMainTabExit, exitWarningShown]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  return {
    registerModal,
    unregisterModal,
    isModalOpen: modalStack.length > 0,
    modalCount: modalStack.length
  };
};

// 개별 모달에서 사용할 훅 (기존 유지)
export const useModalBackHandler = (
  isOpen: boolean,
  onClose: () => void,
  type: 'dialog' | 'popover' | 'calendar' | 'dropdown' = 'dialog'
) => {
  const { registerModal, unregisterModal } = useBackHandler();
  const modalIdRef = useRef<string>();

  useEffect(() => {
    if (isOpen) {
      const modalId = `${type}-${Date.now()}-${Math.random()}`;
      modalIdRef.current = modalId;

      registerModal({
        id: modalId,
        type,
        closeFn: onClose
      });

      return () => {
        unregisterModal(modalId);
      };
    } else if (modalIdRef.current) {
      unregisterModal(modalIdRef.current);
      modalIdRef.current = undefined;
    }
  }, [isOpen, onClose, type, registerModal, unregisterModal]);
};