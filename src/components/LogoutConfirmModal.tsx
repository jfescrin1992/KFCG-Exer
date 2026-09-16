import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  userName?: string;
  userRole?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  userName,
  userRole,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="logout-confirm-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          id="logout-confirm-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[2rem] border border-neutral-100 shadow-2xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            id="btn-close-logout-modal"
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            title="Cancel and close"
          >
            <X size={18} />
          </button>

          {/* Header badge & title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
              <LogOut size={22} className="text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-neutral-900 tracking-tight">Confirm Logout</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Are you sure you want to end your current session?
              </p>
            </div>
          </div>

          {/* Profile summary badge */}
          {userName && (
            <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-neutral-800">{userName}</span>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  {userRole === 'teacher' ? 'Faculty Admin' : 'Student Account'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-neutral-200 text-neutral-600 rounded-full font-bold text-[10px]">
                Active
              </span>
            </div>
          )}

          {/* Caution note */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-amber-800 text-xs">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>Unsaved live motion tracking progress will be reset upon signing out.</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="btn-cancel-logout"
              type="button"
              onClick={onCancel}
              className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-logout"
              type="button"
              onClick={onConfirm}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
            >
              <LogOut size={14} />
              Yes, Log Out
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
