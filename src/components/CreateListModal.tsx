import React, { useState } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

import { createPortal } from 'react-dom';

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, emoji?: string, description?: string) => void;
}

export default function CreateListModal({ isOpen, onClose, onCreate }: CreateListModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [emoji, setEmoji] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    if (!isOpen) return null;

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setEmoji(emojiData.emoji);
        setShowPicker(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), emoji || undefined, description.trim() || undefined);
            // Reset and close
            setName('');
            setDescription('');
            setEmoji(null);
            onClose();
        }
    };

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
            zIndex: 9999 // Increased z-index
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                width: '100%',
                maxWidth: '500px', // Matches the wider look in screenshot
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <form onSubmit={handleSubmit}>
                    {/* Row 1: Emoji + Name */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Emoji Trigger */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowPicker(!showPicker)}
                                style={{
                                    width: '48px', // Approx square
                                    height: '48px',
                                    borderRadius: '8px', // Square-ish styling from screenshot
                                    border: '1px solid #000', // Bold border
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                {emoji || <Smile size={24} color="#666" />}
                            </button>

                            {/* Emoji Picker Popover */}
                            {showPicker && (
                                <div style={{
                                    position: 'absolute',
                                    top: '60px',
                                    left: 0,
                                    zIndex: 1001,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                    <EmojiPicker
                                        emojiStyle={EmojiStyle.NATIVE}
                                        onEmojiClick={handleEmojiClick}
                                        width={350}
                                        height={400}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Name Input */}
                        <input
                            autoFocus
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                fontSize: '1rem',
                                border: '2px solid #000', // Bold border match
                                borderRadius: '8px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Row 2: Description */}
                    <div style={{ marginBottom: '2rem' }}>
                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{
                                width: '93%', // Full width minus padding
                                padding: '1rem',
                                fontSize: '1rem',
                                border: '2px solid #000', // Bold border match
                                borderRadius: '8px',
                                minHeight: '120px',
                                resize: 'none',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Footer: Save/Cancel */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            style={{
                                padding: '0.8rem 2rem',
                                backgroundColor: 'white',
                                color: 'black',
                                border: '2px solid #000',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: name.trim() ? 1 : 0.5
                            }}
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.8rem 2rem',
                                backgroundColor: 'white',
                                color: 'black',
                                border: '2px solid #000',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
