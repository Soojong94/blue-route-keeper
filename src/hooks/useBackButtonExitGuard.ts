
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 모바일 환경에서 뒤로가기 버튼을 두 번 눌러야 앱이 종료되도록 처리하는 훅.
 * PWA 또는 웹앱 환경에서 사용자의 실수로 인한 앱 종료를 방지합니다.
 */
export const useBackButtonExitGuard = () => {
  const [isExitAttempted, setIsExitAttempted] = useState(false);

  const handlePopState = useCallback((event: PopStateEvent) => {
    // 사용자가 뒤로가기를 시도했을 때
    if (!isExitAttempted) {
      // 첫 번째 시도
      event.preventDefault(); // 기본 동작(앱 종료 또는 이전 페이지 이동)을 막음
      setIsExitAttempted(true);
      toast.info('한 번 더 누르면 종료됩니다.', {
        duration: 2000,
        position: 'bottom-center',
      });

      // 2초 후에 종료 시도 상태를 리셋
      setTimeout(() => {
        setIsExitAttempted(false);
      }, 2000);
    } else {
      // 두 번째 시도 (2초 이내)
      // 여기서는 기본 동작을 막지 않으므로, 앱이 종료되거나 이전 페이지로 이동함
    }
  }, [isExitAttempted]);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 popstate 이벤트 리스너 추가
    window.addEventListener('popstate', handlePopState);

    // 컴포넌트가 언마운트될 때 리스너 제거
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);
};
