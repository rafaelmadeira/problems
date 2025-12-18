import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CheckButtonProps {
    completed: boolean;
    onClick: (e: React.MouseEvent) => void;
    size?: number;
    style?: React.CSSProperties;
}

export default function CheckButton({ completed, onClick, size = 24, style }: CheckButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: completed ? '#22c55e' : (isHovered ? '#22c55e' : '#e5e5e5'),
                padding: 0,
                ...style // Allow overriding padding via style prop
            }}
        >
            <CheckCircle2
                size={size}
                fill={completed ? "#22c55e" : "transparent"}
                color={completed ? "#fff" : (isHovered ? '#22c55e' : '#e5e5e5')}
            />
        </button>
    );
}
