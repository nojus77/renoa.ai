import { create } from 'zustand'
import toast from 'react-hot-toast'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: number) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now(), message, type },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    })
  },
  
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    })
  },
  
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    })
  },
  
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  }
}