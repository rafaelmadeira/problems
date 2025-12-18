import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Delete",
    cancelText = "Cancel",
    isDestructive = true
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }} onClick={onCancel}>
            <div style={{
                backgroundColor: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                width: '320px',
                maxWidth: '90%',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: isDestructive ? '#ef4444' : '#111',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
