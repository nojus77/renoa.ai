import { create } from 'zustand'

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