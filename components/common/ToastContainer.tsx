import { useEffect } from 'react'
import { useToastStore } from '@/lib/toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, 3000)
      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-white
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}
            transform transition-all duration-300 ease-in-out
          `}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}