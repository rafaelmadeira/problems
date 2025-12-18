import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Plus, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';
import CreateProblemModal from '../components/CreateProblemModal';
import CheckButton from '../components/CheckButton';

export default function InboxPage() {
    const { state, updateProblem, moveProblemToList } = useStore();
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [showCompleted, setShowCompleted] = useState(false);
    const [isMoveListOpen, setIsMoveListOpen] = useState(false);
    const [currentProblemForMove, setCurrentProblemForMove] = useState<Problem | null>(null);

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



    const handleOpenMoveModal = (p: Problem, e: React.MouseEvent) => {
        e.stopPropagation();
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

        // Derived logic for display (flattening recursive structure for summary if needed, but here likely just top level)
        // Note: ProblemPage supports recursion, but Inbox usually captures "quick capture". 
        // If Inbox supports sub-problems, we should link to ProblemPage for details.

        return (
            <div
                onClick={() => navigate(`/list/inbox/problem/${task.id}`)}
                style={{
                    padding: '1rem',
                    backgroundColor: '#fff',
                    // border: '1px solid #f0f0f0', // Removed full border
                    borderBottom: '1px solid #f0f0f0', // Matched TaskItemInline
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, background-color 0.2s, opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isCompleted ? (isHovered ? 1 : 0.5) : 1 // Added opacity logic
                }}
                onMouseEnter={e => {
                    setIsHovered(true);
                    e.currentTarget.style.backgroundColor = '#f9f9f9'; // Matched hover bg
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
                            color: isCompleted ? '#333' : '#111', // Updated color
                            fontWeight: 500
                        }}>
                            {task.name}
                        </div>
                        {isSolvedMessage && <span style={{ fontSize: '0.8rem', color: '#22c55e', marginLeft: '0.5rem' }}>Splendid!</span>}

                        {/* Metadata Row */}
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
                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => handleOpenMoveModal(task, e)}
                        title="Move to list"
                        style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ccc',
                            transition: 'color 0.2s',
                            display: 'flex'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#666'}
                        onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    >
                        <MoreHorizontal size={18} />
                    </button>
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
                                <ChevronRight size={16} />
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
        </div>
    );
}
