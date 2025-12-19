
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    if (!isOpen) return null;

    const sections = [
        {
            title: 'Navigation',
            shortcuts: [
                { keys: ['i'], description: 'Go to Inbox' },
                { keys: ['t'], description: 'Go to Today' },
                { keys: ['w'], description: 'Go to This Week' },
                { keys: ['u'], description: 'Go to Upcoming' },
                { keys: ['h'], description: 'Go to Home' },
                { keys: ['b'], description: 'Back' },
            ]
        },
        {
            title: 'Actions',
            shortcuts: [
                { keys: ['c'], description: 'Capture (New in Inbox)' },
                { keys: ['n'], description: 'New Problem (Context)' },
                { keys: ['d'], description: 'Delete Problem/List' },
                { keys: ['s'], description: 'Solve Problem' },
                { keys: ['f'], description: 'Start Focus Session' },
            ]
        },
        {
            title: 'Lists',
            shortcuts: [
                { keys: ['l'], description: 'New List' },
                { keys: ['1-9'], description: 'Go to List' },
                { keys: ['0'], description: 'Cycle through Lists' },
            ]
        }
    ];

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
            zIndex: 2000
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '600px',
                maxWidth: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#333'
                        }}>
                            <Command size={18} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h3 style={{
                                margin: '0 0 1rem 0',
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#888',
                                fontWeight: 600
                            }}>
                                {section.title}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {section.shortcuts.map((shortcut, sIdx) => (
                                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{shortcut.description}</span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {shortcut.keys.map((key, kIdx) => (
                                                <kbd key={kIdx} style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: '#f5f5f5',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    minWidth: '20px',
                                                    textAlign: 'center',
                                                    color: '#555',
                                                    lineHeight: '1.2',
                                                    boxShadow: '0 1px 0 #e0e0e0'
                                                }}>
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}
