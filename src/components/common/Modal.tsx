'use client';

// ============================================
// DeadlineGuard — Common Modal Component
// ============================================

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  id: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  id,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock body scroll
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Unlock
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (overlayRef.current === e.target) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="modal-overlay"
      id={`${id}-overlay`}
    >
      <div className={`modal-container modal-${size}`} id={id}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <Button
            id={`${id}-close`}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close-btn"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
