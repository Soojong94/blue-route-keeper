import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const useBackButtonExitGuard = () => {
  const isExitAttempted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (isExitAttempted.current) {
        // 두 번째 시도: 앱 종료 허용
        isExitAttempted.current = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // 사용자가 실제로 뒤로 가도록 허용
        return;
      }

      // 첫 번째 시도
      isExitAttempted.current = true;
      toast.info('한 번 더 누르면 종료됩니다.', {
        duration: 2000,
        position: 'bottom-center',
      });

      // 뒤로가기 방지: 현재 페이지를 history에 다시 추가
      history.pushState(null, '', location.href);

      // 2초 후에 종료 시도 상태 리셋
      timeoutRef.current = setTimeout(() => {
        isExitAttempted.current = false;
      }, 2000);
    };

    // 초기 history 상태 설정 및 이벤트 리스너 추가
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};