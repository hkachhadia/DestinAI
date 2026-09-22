/**
 * Thin wrapper around react-hot-toast that provides a consistent DestinAI
 * visual style for all notifications. Import `toast` from here — never
 * directly from 'react-hot-toast' — so the style is applied everywhere.
 */
import { Toaster, toast as hotToast } from 'react-hot-toast';

// Re-export with DestinAI styling
export const toast = {
  success: (message: string) =>
    hotToast.success(message, {
      style: {
        background: 'rgba(20, 20, 30, 0.95)',
        color: '#e8edf0',
        border: '1px solid rgba(195, 244, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'inherit',
        fontSize: '14px',
      },
      iconTheme: { primary: 'var(--accent)', secondary: '#0d0f1a' },
    }),

  error: (message: string) =>
    hotToast.error(message, {
      style: {
        background: 'rgba(20, 20, 30, 0.95)',
        color: '#e8edf0',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'inherit',
        fontSize: '14px',
      },
    }),

  info: (message: string) =>
    hotToast(message, {
      style: {
        background: 'rgba(20, 20, 30, 0.95)',
        color: '#e8edf0',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'inherit',
        fontSize: '14px',
      },
      icon: '💡',
    }),

  loading: (message: string) => hotToast.loading(message, {
    style: {
      background: 'rgba(20, 20, 30, 0.95)',
      color: '#e8edf0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      fontFamily: 'inherit',
      fontSize: '14px',
    },
  }),

  dismiss: hotToast.dismiss,
};

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{ duration: 4000 }}
    />
  );
}
