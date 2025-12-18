import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext';
import type { Problem } from '../types';

interface CreateProblemModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultListId: string;
    showListSelector?: boolean;
    parentId?: string | null;
}

export default function CreateProblemModal({ isOpen, onClose, defaultListId, showListSelector = false, parentId = null }: CreateProblemModalProps) {
    const { state, addProblem } = useStore();
    const [name, setName] = useState('');
    const [priority, setPriority] = useState<Problem['priority']>('someday');
    const [status, setStatus] = useState<Problem['status']>('to_solve');
    const [dueDate, setDueDate] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedListId, setSelectedListId] = useState(defaultListId);

    // Filter out inbox if needed, or show all. Usually list selector shows all.
    const allLists = state.lists;

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        let durationMs = undefined;
        if (estimatedDuration.trim()) {
            const val = estimatedDuration.trim().toLowerCase();
            let totalMinutes = 0;
            const hMatch = val.match(/(\d+)\s*h/);
            if (hMatch) totalMinutes += parseInt(hMatch[1], 10) * 60;
            const mMatch = val.match(/(\d+)\s*m/);
            if (mMatch) totalMinutes += parseInt(mMatch[1], 10);
            if (!hMatch && !mMatch) {
                const num = parseInt(val, 10);
                if (!isNaN(num)) totalMinutes = num;
            }
            if (totalMinutes > 0) durationMs = totalMinutes * 60000;
        }

        const targetListId = showListSelector ? selectedListId : defaultListId;

        // Add to root of the list or as subtask
        addProblem(parentId, targetListId, {
            name: name.trim(),
            priority,
            status,
            dueDate: dueDate || null,
            estimatedDuration: durationMs,
            notes
        });

        // Reset and close
        setName('');
        setPriority('someday');
        setStatus('to_solve');
        setDueDate('');
        setEstimatedDuration('');
        setNotes('');
        onClose();
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
            zIndex: 9999
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' // Added shadow for better separation
            }} onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Line 1: Task Name */}
                    <input
                        autoFocus
                        type="text"
                        placeholder="Problem name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            width: '100%',
                            fontFamily: 'inherit'
                        }}
                    />

                    {/* Line 2 (Optional): List Selector */}
                    {showListSelector && (
                        <select
                            value={selectedListId}
                            onChange={e => setSelectedListId(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                width: '100%',
                                fontFamily: 'inherit'
                            }}
                        >
                            {allLists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.emoji ? `${list.emoji} ` : ''}{list.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Line 3: Priority + Status */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value as Problem['priority'])}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                flex: 1,
                                fontFamily: 'inherit'
                            }}
                        >
                            <option value="today">Today</option>
                            <option value="this_week">This Week</option>
                            <option value="later">Later</option>
                            <option value="recurring">Recurring</option>
                            <option value="someday">Someday</option>
                        </select>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as Problem['status'])}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                flex: 1,
                                fontFamily: 'inherit'
                            }}
                        >
                            <option value="to_solve">To Solve</option>
                            <option value="solving">Working on it</option>
                            <option value="blocked">Blocked</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="solved">Solved</option>
                        </select>
                    </div>

                    {/* Line 4: Due Date + Estimated Duration */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                flex: 1,
                                fontFamily: 'inherit'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Est. Duration (e.g. 1h 30m)"
                            value={estimatedDuration}
                            onChange={e => setEstimatedDuration(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                flex: 1,
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Line 5: Notes */}
                    <textarea
                        placeholder="Notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontFamily: 'inherit',
                            resize: 'none'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                borderRadius: '8px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                                borderRadius: '8px',
                                fontWeight: '600',
                                border: 'none',
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
