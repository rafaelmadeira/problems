import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Plus, ChevronRight, MoreHorizontal, ArrowRight, Trash2 } from 'lucide-react';
import type { Problem } from '../types';
import CreateProblemModal from '../components/CreateProblemModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckButton from '../components/CheckButton';
import { formatDueDate } from '../utils/dateUtils';

export default function InboxPage() {
    const { state, updateProblem, moveProblemToList, deleteProblem } = useStore();
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [showCompleted, setShowCompleted] = useState(false);
    const [isMoveListOpen, setIsMoveListOpen] = useState(false);
    const [currentProblemForMove, setCurrentProblemForMove] = useState<Problem | null>(null);

    const [activeMenuTaskId, setActiveMenuId] = useState<string | null>(null);
    const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Filter logic for Inbox
    const inboxList = state.lists.find(l => l.id === 'inbox');

    if (!inboxList) {
        return <div style={{ padding: '2rem' }}>Inbox not found</div>;
    }

    const subElements = inboxList.problems;
    const activeSubElements = subElements.filter(p => !p.completed);
    const completedSubElements = subElements.filter(p => p.completed);

    useEffect(() => {
        document.title = `Problems Inbox (${activeSubElements.length})`;
    }, [activeSubElements.length]);

    // Handle global clicks to close menu
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle Esc key to close menu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveMenuId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleComplete = (p: Problem) => {
        const newCompleted = !p.completed;
        updateProblem('inbox', p.id, {
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

    const toggleMenu = (id: string) => {
        setActiveMenuId(prev => (prev === id ? null : id));
    };

    const handleOpenMoveModal = (p: Problem) => {
        setCurrentProblemForMove(p);
        setIsMoveListOpen(true);
    };

    const handleMoveToList = (targetListId: string) => {
        if (currentProblemForMove) {
            moveProblemToList(currentProblemForMove.id, 'inbox', targetListId);
            setIsMoveListOpen(false);
            setCurrentProblemForMove(null);
        }
    };

    const InboxTaskItem = ({ task }: { task: Problem }) => {
        const isCompleted = task.completed;
        const isSolvedMessage = solvedMessages[task.id];
        const [isHovered, setIsHovered] = React.useState(false);
        const isMenuOpen = activeMenuTaskId === task.id;

        return (
            <div
                onClick={() => navigate(`/list/inbox/problem/${task.id}`)}
                style={{
                    padding: '1rem',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, background-color 0.2s, opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isCompleted ? (isHovered ? 1 : 0.5) : 1,
                    position: 'relative' // Needed for menu positioning
                }}
                onMouseEnter={e => {
                    setIsHovered(true);
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseLeave={e => {
                    setIsHovered(false);
                    e.currentTarget.style.backgroundColor = '#fff';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <CheckButton
                        completed={isCompleted}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(task);
                        }}
                        size={24}
                    />

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '1rem',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? '#333' : '#111',
                            fontWeight: 500
                        }}>
                            {task.name}
                        </div>
                        {isSolvedMessage && <span style={{ fontSize: '0.8rem', color: '#22c55e', marginLeft: '0.5rem' }}>Splendid!</span>}

                        {!isCompleted && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#888' }}>
                                {task.priority && task.priority !== 'later' && (
                                    <span style={{
                                        color: task.priority === 'today' ? '#ef4444' : '#f59e0b',
                                        fontWeight: 500,
                                        textTransform: 'capitalize'
                                    }}>
                                        {task.priority.replace('_', ' ')}
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span style={{
                                        color: (() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const [y, m, d] = task.dueDate.split('-').map(Number);
                                            const due = new Date(y, m - 1, d);
                                            if (due < today) return '#ef4444';
                                            if (due.getTime() === today.getTime()) return '#f97316';
                                            return 'inherit';
                                        })(),
                                        fontWeight: (() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const [y, m, d] = task.dueDate.split('-').map(Number);
                                            const due = new Date(y, m - 1, d);
                                            return (due < today || due.getTime() === today.getTime()) ? 'bold' : 'normal';
                                        })()
                                    }}>
                                        Due {formatDueDate(task.dueDate)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(task.id);
                        }}
                        title="More options"
                        style={{
                            padding: '6px',
                            background: isMenuOpen ? '#eee' : 'none',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: isMenuOpen ? '#333' : '#ccc',
                            transition: 'color 0.2s, background-color 0.2s',
                            display: 'flex'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#666'}
                        onMouseLeave={e => e.currentTarget.style.color = isMenuOpen ? '#333' : '#ccc'}
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {isMenuOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: '8px',
                                zIndex: 10,
                                minWidth: '160px',
                                padding: '4px',
                                border: '1px solid #eee'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    handleOpenMoveModal(task);
                                    setActiveMenuId(null);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#333'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <ArrowRight size={14} />
                                Move to list
                            </button>
                            <button
                                onClick={() => {
                                    setProblemToDelete(task);
                                    setIsDeleteModalOpen(true);
                                    setActiveMenuId(null);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#ef4444'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Move List Modal */}
            {isMoveListOpen && currentProblemForMove && (
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
                    <InboxMoveListModalContent onClose={() => setIsMoveListOpen(false)}>
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
                                    l.id !== 'inbox' && (
                                        <InboxMoveListOption
                                            key={l.id}
                                            list={l}
                                            onMove={() => handleMoveToList(l.id)}
                                        />
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
                    </InboxMoveListModalContent>
                </div>
            )}

            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                <span style={{ fontWeight: 600, color: '#333' }}>Inbox</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, marginBottom: '0.5rem' }}>Inbox</h1>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.875rem' }}>
                        Capture problems here for organizing
                    </p>
                </div>
            </div>

            <div style={{ minHeight: '200px' }}>
                {activeSubElements.length === 0 && completedSubElements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#ccc' }}>
                        <p>Inbox is empty</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {activeSubElements.map(p => (
                            <InboxTaskItem key={p.id} task={p} />
                        ))}
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
                            fontSize: '0.875rem'
                        }}
                    >
                        <Plus size={20} />
                        <span>New Problem</span>
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
                                fontSize: '0.875rem',
                                fontWeight: 'normal',
                                cursor: 'pointer',
                                padding: '0.5rem 0'
                            }}
                        >
                            <span style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                                <ChevronRight size={16} color="#999" />
                            </span>
                            {completedSubElements.length} problems solved
                        </button>

                        {showCompleted && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {completedSubElements.map(p => (
                                    <InboxTaskItem key={p.id} task={p} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateProblemModal
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                defaultListId="inbox"
                parentId={null}
                showListSelector={false}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setProblemToDelete(null);
                }}
                onConfirm={() => {
                    if (problemToDelete) {
                        deleteProblem('inbox', problemToDelete.id);
                        setIsDeleteModalOpen(false);
                        setProblemToDelete(null);
                    }
                }}
                title="Delete Problem"
                message={`Are you sure you want to delete "${problemToDelete?.name || 'this problem'}"? This cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
}


function InboxMoveListOption({ list, onMove }: { list: { id: string, name: string, emoji?: string }, onMove: () => void }) {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
        <button
            onClick={onMove}
            style={{
                padding: '0.75rem',
                textAlign: 'left',
                backgroundColor: isHovered ? '#eee' : '#f9f9f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                width: '100%'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {list.emoji && <span style={{ marginRight: '0.5rem' }}>{list.emoji}</span>}
            {list.name}
        </button>
    );
}

function InboxMoveListModalContent({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    return <>{children}</>;
}

