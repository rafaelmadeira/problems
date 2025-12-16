import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronRight, Plus, CheckCircle2, MoreHorizontal, Trash2, X } from 'lucide-react';
import type { Problem } from '../types';

import FocusSession from '../components/FocusSession';

export default function ProblemPage() {
    const { listId, problemId } = useParams();
    const navigate = useNavigate();
    const { state, addProblem, updateProblem, updateList, deleteList, deleteProblem, reorderProblems, moveProblemToList } = useStore();

    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [newPriority, setNewPriority] = useState<Problem['priority']>('someday');
    const [newDueDate, setNewDueDate] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isMoveListOpen, setIsMoveListOpen] = useState(false);
    const [isFocusOpen, setIsFocusOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [showCompleted, setShowCompleted] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const dateInputRef = React.useRef<HTMLInputElement>(null);

    // 1. Find the List
    const list = state.lists.find(l => l.id === listId);

    // 2. Find the Problem and Path (if problemId exists)
    const findPath = (problems: Problem[], targetId: string, currentPath: Problem[] = []): Problem[] | null => {
        for (const p of problems) {
            if (p.id === targetId) {
                return [...currentPath, p];
            }
            const found = findPath(p.subproblems, targetId, [...currentPath, p]);
            if (found) return found;
        }
        return null;
    };

    if (!list) return <div style={{ padding: '2rem' }}>List not found</div>;

    let currentProblem: Problem | null = null;
    let breadcrumbs: Problem[] = [];

    if (problemId) {
        breadcrumbs = findPath(list.problems, problemId) || [];
        if (breadcrumbs.length > 0) {
            currentProblem = breadcrumbs[breadcrumbs.length - 1];
        }
    }

    if (problemId && !currentProblem) {
        return <div style={{ padding: '2rem' }}>Problem not found</div>;
    }

    // View Data
    const subElements = currentProblem ? currentProblem.subproblems : list.problems;
    const activeSubElements = subElements.filter(p => !p.completed);
    const completedSubElements = subElements.filter(p => p.completed);
    const currentParentId = currentProblem ? currentProblem.id : null;

    // Check if it's a top-level task (root task)
    // A top-level task has breadcrumbs length of 1 (just itself)
    const isRootTask = breadcrumbs.length === 1 && currentProblem;

    const toggleMenu = (id: string) => {
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskName.trim()) {
            addProblem(currentParentId, list.id, {
                name: newSubtaskName.trim(),
                priority: newPriority,
                dueDate: newDueDate || null,
                notes: newNotes
            });
            setNewSubtaskName('');
            setNewPriority('someday');
            setNewDueDate('');
            setNewNotes('');
            setIsAdding(false);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentProblem) {
            updateProblem(list.id, currentProblem.id, { notes: e.target.value });
        }
    };

    const toggleComplete = (p: Problem) => {
        const newCompleted = !p.completed;
        updateProblem(list.id, p.id, {
            completed: newCompleted,
            status: newCompleted ? 'solved' : 'to_solve'
        });

        if (newCompleted) {
            setSolvedMessages(prev => ({ ...prev, [p.id]: true }));
            setTimeout(() => {
                setSolvedMessages(prev => {
                    const next = { ...prev };
                    delete next[p.id];
                    return next;
                });
            }, 2000);
        }
    };

    const handleDeleteList = () => {
        // window.confirm might be blocked or causing issues
        deleteList(list.id);
        navigate('/');
    };

    const handleDeleteProblem = () => {
        if (currentProblem) {
            deleteProblem(list.id, currentProblem.id);
            // Navigate up one level
            if (breadcrumbs.length > 1) {
                // breadcrumbs has the full path. The parent is at index length-2
                const parent = breadcrumbs[breadcrumbs.length - 2];
                navigate(`/list/${list.id}/problem/${parent.id}`);
            } else {
                // If top level problem, go back to list
                navigate(`/list/${list.id}`);
            }
        }
    };

    const handleMoveToList = (targetListId: string) => {
        if (currentProblem && list) {
            moveProblemToList(currentProblem.id, list.id, targetListId);
            setIsMoveListOpen(false);
            // Navigate to the new location or home? 
            // Let's navigate to the target list to show it moved.
            navigate(`/list/${targetListId}/problem/${currentProblem.id}`);
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        // Perform reorder on ACTIVE items
        const newActive = [...activeSubElements];
        const draggedItem = newActive[draggedIndex];

        // Remove dragged item
        newActive.splice(draggedIndex, 1);
        // Insert at new position
        newActive.splice(targetIndex, 0, draggedItem);

        // Combine with completed items (Active first, Completed last)
        const newProblems = [...newActive, ...completedSubElements];

        reorderProblems(list.id, currentParentId, newProblems);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }} onClick={() => { setIsMenuOpen(false); setIsMoveListOpen(false); }}>
            {/* Move List Modal */}
            {isMoveListOpen && (
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
                    zIndex: 100
                }} onClick={(e) => {
                    e.stopPropagation();
                    setIsMoveListOpen(false);
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        width: '300px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Move to...</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {state.lists.map(l => (
                                l.id !== list.id && (
                                    <button
                                        key={l.id}
                                        onClick={() => handleMoveToList(l.id)}
                                        style={{
                                            padding: '0.75rem',
                                            textAlign: 'left',
                                            backgroundColor: '#f9f9f9',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {l.name}
                                    </button>
                                )
                            ))}
                            {state.lists.length <= 1 && <p style={{ color: '#888' }}>No other lists available.</p>}
                        </div>
                        <button
                            onClick={() => setIsMoveListOpen(false)}
                            style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'none', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                {!currentProblem ? (
                    <span style={{ fontWeight: 600, color: '#333' }}>{list.name}</span>
                ) : (
                    <Link to={`/list/${list.id}`} style={{ color: 'inherit' }}>{list.name}</Link>
                )}
                {breadcrumbs.slice(0, -1).map(p => (
                    <React.Fragment key={p.id}>
                        <ChevronRight size={14} />
                        <Link
                            to={`/list/${list.id}/problem/${p.id}`}
                            style={{ fontWeight: p.name.endsWith('!') ? 'bold' : 'normal' }}
                        >
                            {p.name}
                        </Link>
                    </React.Fragment>
                ))}
                {currentProblem && (
                    <>
                        <ChevronRight size={14} />
                        <span style={{ fontWeight: 600, color: '#333' }}>{currentProblem.name}</span>
                    </>
                )}
            </nav>

            {/* Focus Session Overlay */}
            {isFocusOpen && currentProblem && (
                <FocusSession
                    problem={currentProblem}
                    onExit={() => setIsFocusOpen(false)}
                    onUpdateProblem={(id, updates) => updateProblem(list.id, id, updates)}
                />
            )}

            {/* History Modal */}
            {isHistoryOpen && currentProblem && (
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
                    zIndex: 200
                }} onClick={() => setIsHistoryOpen(false)}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        width: '500px', // Wider implementation
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Session History</h3>
                            <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#666" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {/* Table Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 600, color: '#666', fontSize: '0.9rem' }}>
                                <div>Start Time</div>
                                <div>End Time</div>
                                <div style={{ textAlign: 'right' }}>Duration</div>
                            </div>

                            {/* Sessions List */}
                            {(() => {
                                const sessions = currentProblem.sessions || [];
                                const totalTime = currentProblem.totalTime || 0;

                                // Calculate total session duration
                                const sessionTotal = sessions.reduce((sum, s) => sum + s.duration, 0);

                                // Identify Legacy Time
                                const legacyTime = totalTime - sessionTotal;

                                return (
                                    <>
                                        {sessions.length === 0 && legacyTime <= 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                                                No recorded sessions.
                                            </div>
                                        )}
                                        {/* Sort sessions by latest first */}
                                        {[...sessions].sort((a, b) => b.startTime - a.startTime).map((session, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '0.75rem 0.5rem', borderBottom: '1px solid #f9f9f9', fontSize: '0.95rem' }}>
                                                <div>{new Date(session.startTime).toLocaleString()}</div>
                                                <div>{new Date(session.endTime).toLocaleTimeString()}</div>
                                                <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                    {(() => {
                                                        const seconds = Math.floor(session.duration / 1000);
                                                        const m = Math.floor(seconds / 60);
                                                        const s = seconds % 60;
                                                        return `${m}m ${s}s`;
                                                    })()}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Legacy Session Entry */}
                                        {legacyTime > 1000 && ( // Threshold of 1s to ignore rounding errors
                                            <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', padding: '0.75rem 0.5rem', borderBottom: '1px solid #f9f9f9', fontSize: '0.95rem', color: '#888', fontStyle: 'italic' }}>
                                                <div>Legacy Time (Pre-tracking)</div>
                                                <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                    {(() => {
                                                        const totalSeconds = Math.floor(legacyTime / 1000);
                                                        const h = Math.floor(totalSeconds / 3600);
                                                        const m = Math.floor((totalSeconds % 3600) / 60);
                                                        // const s = totalSeconds % 60; 
                                                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>Total Time</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600 }}>
                                {(() => {
                                    const totalSeconds = Math.floor((currentProblem.totalTime || 0) / 1000);
                                    const hours = Math.floor(totalSeconds / 3600);
                                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                                    const seconds = totalSeconds % 60;
                                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <header style={{ marginBottom: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    {!currentProblem ? (
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={list.name}
                                onChange={(e) => updateList(list.id, { name: e.target.value })}
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem',
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <textarea
                                value={list.description || ''}
                                onChange={(e) => {
                                    updateList(list.id, { description: e.target.value });
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onFocus={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                placeholder="Description..."
                                maxLength={500}
                                rows={1}
                                style={{
                                    width: '100%',
                                    // minHeight: '100px', // Removed fixed height
                                    fontSize: '1rem',
                                    color: '#555',
                                    resize: 'none',
                                    lineHeight: '1.6',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit',
                                    overflow: 'hidden',
                                    minHeight: '24px' // Consistent with single line
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ flex: 1 }}>
                            {/* Task Name */}
                            <input
                                type="text"
                                value={currentProblem.name}
                                onChange={(e) => updateProblem(list.id, currentProblem!.id, { name: e.target.value })}
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1.5rem',
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit',
                                    color: '#111'
                                }}
                            />

                            {/* Task Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem 1rem', alignItems: 'center' }}>
                                {/* Priority */}
                                <div style={{ color: '#888', fontSize: '0.95rem' }}>Priority</div>
                                <div style={{ marginTop: '-1px' }}>
                                    <select
                                        value={currentProblem.priority || 'today'}
                                        onChange={(e) => updateProblem(list.id, currentProblem!.id, { priority: e.target.value as Problem['priority'] })}
                                        style={{
                                            appearance: 'none',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            fontSize: '0.95rem',
                                            color: '#111',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontFamily: 'inherit',
                                            textDecoration: 'underline',
                                            textUnderlineOffset: '3px',
                                            textDecorationColor: '#ddd'
                                        }}
                                    >
                                        <option value="today">Today</option>
                                        <option value="this_week">This Week</option>
                                        <option value="later">Later</option>
                                        <option value="someday">Someday</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div style={{ color: '#888', fontSize: '0.95rem' }}>Status</div>
                                <div style={{ marginTop: '-1px' }}>
                                    <select
                                        value={currentProblem.status || 'to_solve'}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as Problem['status'];
                                            updateProblem(list.id, currentProblem!.id, {
                                                status: newStatus,
                                                completed: newStatus === 'solved'
                                            });
                                        }}
                                        style={{
                                            appearance: 'none',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            fontSize: '0.95rem',
                                            color: '#111',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontFamily: 'inherit',
                                            textDecoration: 'underline',
                                            textUnderlineOffset: '3px',
                                            textDecorationColor: '#ddd'
                                        }}
                                    >
                                        <option value="to_solve">To Solve</option>
                                        <option value="solving">Working on it</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="solved">Solved!</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div style={{ color: '#888', fontSize: '0.95rem' }}>Due Date</div>
                                <div style={{ marginTop: '-1px' }}>
                                    {currentProblem.dueDate ? (
                                        <input
                                            type="date"
                                            value={currentProblem.dueDate}
                                            onChange={(e) => updateProblem(list.id, currentProblem!.id, { dueDate: e.target.value || null })}
                                            style={{
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                fontSize: '0.95rem',
                                                color: '#111',
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (dateInputRef.current) {
                                                        try {
                                                            dateInputRef.current.showPicker();
                                                        } catch (err) {
                                                            // Fallback or ignore
                                                            dateInputRef.current.click();
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    color: '#999',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.95rem',
                                                    fontFamily: 'sans-serif'
                                                }}
                                            >
                                                Add date
                                            </button>
                                            <input
                                                ref={dateInputRef}
                                                type="date"
                                                onChange={(e) => updateProblem(list.id, currentProblem!.id, { dueDate: e.target.value || null })}
                                                style={{
                                                    opacity: 0,
                                                    position: 'absolute',
                                                    zIndex: -1,
                                                    width: '1px',
                                                    height: '1px',
                                                    overflow: 'hidden',
                                                    top: 0,
                                                    left: 0
                                                }}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Time Spent (Focus Mode Metadata) */}
                                <div style={{ color: '#888', fontSize: '0.95rem' }}>Time Spent</div>
                                <div style={{ fontSize: '0.95rem', color: '#111', fontFamily: 'monospace', marginTop: '1px' }}>
                                    {currentProblem.totalTime ? (
                                        <button
                                            onClick={() => setIsHistoryOpen(true)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                cursor: 'pointer',
                                                fontSize: '0.95rem',
                                                fontFamily: 'monospace',
                                                color: '#111',
                                                textDecoration: 'underline',
                                                textDecorationColor: '#ddd'
                                            }}
                                        >
                                            {(() => {
                                                const totalSeconds = Math.floor(currentProblem.totalTime / 1000);
                                                const hours = Math.floor(totalSeconds / 3600);
                                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                                const seconds = totalSeconds % 60;

                                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                            })()}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsFocusOpen(true)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                color: '#999',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.95rem',
                                                fontFamily: 'sans-serif'
                                            }}
                                        >
                                            Start focus
                                        </button>
                                    )}
                                </div>

                                {/* Notes */}
                                <div style={{ color: '#888', fontSize: '0.95rem', alignSelf: 'flex-start' }}>Notes</div>
                                <div>
                                    <textarea
                                        className="notes-textarea"
                                        value={currentProblem.notes || ''}
                                        onChange={(e) => {
                                            handleNotesChange(e);
                                            // Auto-resize
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="Add notes"
                                        rows={1}
                                        style={{
                                            width: '100%',
                                            fontSize: '0.95rem',
                                            color: '#111',
                                            resize: 'none',
                                            lineHeight: '1.5',
                                            border: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                            fontFamily: 'inherit',
                                            padding: 0,
                                            overflow: 'hidden',
                                            minHeight: '24px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        style={{ position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                color: '#888',
                                display: (!currentProblem && list.id === 'inbox') ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            aria-label="Menu"
                        >
                            <MoreHorizontal size={24} />
                        </button>
                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                zIndex: 10,
                                minWidth: '160px',
                                border: '1px solid #f0f0f0'
                            }}>
                                {!currentProblem ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteList();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            width: '100%',
                                            color: '#ef4444',
                                            fontWeight: '500',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete List
                                    </button>
                                ) : (
                                    <>
                                        {/* Focus Action */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                setIsFocusOpen(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                color: '#333',
                                                fontWeight: '500',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <CheckCircle2 size={16} /> {/* Use CheckCircle as icon or maybe something else? Lucide has Focus or Target? Using CheckCircle for now as placeholder for Focus */}
                                            Focus
                                        </button>

                                        {isRootTask && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setIsMoveListOpen(true);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    width: '100%',
                                                    color: '#333',
                                                    fontWeight: '500',
                                                    textAlign: 'left',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                <ChevronRight size={16} />
                                                Move to list
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProblem();
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                color: '#ef4444',
                                                fontWeight: '500',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            Delete Task
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <style>{`
                @keyframes fadeOutUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    70% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
                }
                .notes-textarea::placeholder {
                    color: #999 !important;
                    opacity: 1 !important;
                }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeSubElements.map((child, index) => {
                    const childCount = child.subproblems.filter(p => !p.completed).length;
                    return (
                        <div
                            key={child.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => navigate(`/list/${list.id}/problem/${child.id}`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderRadius: '8px',
                                backgroundColor: draggedIndex === index ? '#f0f0f0' : 'transparent',
                                opacity: draggedIndex === index ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (draggedIndex === null) e.currentTarget.style.backgroundColor = '#f9f9f9';
                            }}
                            onMouseLeave={(e) => {
                                if (draggedIndex === null) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ position: 'relative' }}>
                                    {solvedMessages[child.id] && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: '#22c55e',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            animation: 'fadeOutUp 2s ease-out forwards',
                                            pointerEvents: 'none',
                                            marginBottom: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            Problem solved!
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                borderLeft: '4px solid transparent',
                                                borderRight: '4px solid transparent',
                                                borderTop: '4px solid #22c55e'
                                            }} />
                                        </div>
                                    )}
                                    <button
                                        title="solve problem"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleComplete(child);
                                        }}
                                        style={{
                                            color: child.completed ? '#22c55e' : '#e5e5e5',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'none',
                                            border: 'none',
                                            padding: 0
                                        }}
                                    >
                                        <CheckCircle2 size={24} fill={child.completed ? "#22c55e" : "transparent"} color={child.completed ? "#fff" : "#e5e5e5"} />
                                    </button>
                                </div>
                                <Link
                                    to={`/list/${list.id}/problem/${child.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        fontSize: '1.1rem',
                                        textDecoration: child.completed ? 'line-through' : 'none',
                                        color: child.completed ? '#aaa' : '#333',
                                        cursor: 'pointer',
                                        fontWeight: child.name.endsWith('!') ? 'bold' : 'normal',
                                    }}
                                >
                                    {child.name}
                                </Link>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {childCount > 0 && (
                                    <span style={{
                                        backgroundColor: '#e5e5e5',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: '#555'
                                    }}>
                                        {childCount}
                                    </span>
                                )}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            toggleMenu(child.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#ccc',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#888'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {activeMenuId === child.id && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                backgroundColor: 'white',
                                                border: '1px solid #eee',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                zIndex: 50,
                                                minWidth: '150px',
                                                overflow: 'hidden'
                                            }}
                                            onMouseLeave={() => setActiveMenuId(null)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProblem(child.id);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    textAlign: 'left',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#ef4444',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}


            </div>

            {/* New Task Modal */}
            {isAdding && (
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
                    zIndex: 100
                }} onClick={() => setIsAdding(false)}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        width: '400px',
                        maxWidth: '90%',
                    }} onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Task name"
                                value={newSubtaskName}
                                onChange={e => setNewSubtaskName(e.target.value)}
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

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select
                                    value={newPriority}
                                    onChange={e => setNewPriority(e.target.value as Problem['priority'])}
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
                                    <option value="someday">Someday</option>
                                </select>
                                <input
                                    type="date"
                                    value={newDueDate}
                                    onChange={e => setNewDueDate(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        flex: 1,
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <textarea
                                placeholder="Notes"
                                value={newNotes}
                                onChange={e => setNewNotes(e.target.value)}
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
                                    onClick={() => setIsAdding(false)}
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
                </div>
            )}

            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => setIsAdding(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#888',
                        padding: '0.5rem 0',
                        fontFamily: 'inherit',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    <Plus size={20} />
                    <span>New task</span>
                </button>
            </div>

            {completedSubElements.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '0.5rem 0'
                        }}
                    >
                        <span style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                            <ChevronRight size={16} />
                        </span>
                        {completedSubElements.length} completed tasks
                    </button>

                    {showCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                            {completedSubElements.map((child) => {
                                const childCount = child.subproblems.filter(p => !p.completed).length;
                                return (
                                    <div
                                        key={child.id}
                                        onClick={() => navigate(`/list/${list.id}/problem/${child.id}`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            borderRadius: '8px',
                                            opacity: 0.6
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <button
                                                title="unsolve problem"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleComplete(child);
                                                }}
                                                style={{
                                                    color: '#22c55e',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0
                                                }}
                                            >
                                                <CheckCircle2 size={24} fill="#22c55e" color="#fff" />
                                            </button>
                                            <Link
                                                to={`/list/${list.id}/problem/${child.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    fontSize: '1.1rem',
                                                    textDecoration: 'line-through',
                                                    color: '#aaa',
                                                    cursor: 'pointer',
                                                    fontWeight: child.name.endsWith('!') ? 'bold' : 'normal',
                                                }}
                                            >
                                                {child.name}
                                            </Link>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {childCount > 0 && (
                                                <span style={{
                                                    backgroundColor: '#f0f0f0',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    color: '#999'
                                                }}>
                                                    {childCount}
                                                </span>
                                            )}
                                            <div style={{ width: '28px' }}></div> {/* Spacer for menu alignment if menu is omitted */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
