import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red', // 'red' | 'indigo' | 'blue'
  loading = false,
}) => {
  const colorMap = {
    red: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  };

  const btnClass = colorMap[confirmColor] || colorMap.red;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div className="text-sm text-slate-600 leading-relaxed pt-1">
            {message}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium focus:outline-hidden disabled:opacity-50 transition-colors ${btnClass}`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
