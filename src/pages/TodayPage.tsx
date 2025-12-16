import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';

/* 
  Recursive component for rendering a task and its children 
*/
const InternalTaskNode = ({
    problem,
    listId,
    depth,
    toggleComplete,
    solvedMessages,
    expandedIds,
    onToggleExpand
}: {
    problem: Problem,
    listId: string,
    depth: number,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean },
    expandedIds: { [key: string]: boolean },
    onToggleExpand: (id: string) => void
}) => {
    const navigate = useNavigate();

    // Check if node matches ANY category we care about for Today View
    // However, since we are filtering at the top level and passing down,
    // we may want to show the specific reason (Overdue, etc) or just show it because it's in the tree.
    // For Today View, usually we just want to show the task.
    // But we need to define "Is Relevant" for recursion.
    // Relevancy = Is Overdue OR Due Today OR Priority Today.

    const isOverdue = (p: Problem): boolean => {
        if (!p.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = p.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due < today;
    };

    const isDueToday = (p: Problem): boolean => {
        if (!p.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = p.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due.getTime() === today.getTime();
    };

    const isDoToday = (p: Problem): boolean => {
        return p.priority === 'today';
    };

    const isRelevant = (p: Problem): boolean => {
        if (p.completed) return false;
        return isOverdue(p) || isDueToday(p) || isDoToday(p);
    };

    const hasRelevantDescendants = (p: Problem): boolean => {
        if (isRelevant(p)) return true;
        return p.subproblems.some(child => hasRelevantDescendants(child));
    };

    const isSelfRelevant = isRelevant(problem);
    const hasChildrenRelevant = problem.subproblems.some(child => hasRelevantDescendants(child));

    if (!isSelfRelevant && !hasChildrenRelevant) return null;

    const isExpanded = expandedIds[problem.id] || false;

    return (
        <div style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/list/${listId}/problem/${problem.id}`);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {/* Expander */}
                {hasChildrenRelevant ? (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(problem.id);
                        }}
                        style={{ padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginTop: '4px' }}
                    >
                        {isExpanded ? <ChevronDown size={16} color="#888" /> : <ChevronRightIcon size={16} color="#888" />}
                    </div>
                ) : (
                    <div style={{ width: 20 }} />
                )}

                <div style={{ position: 'relative', paddingTop: '2px' }}>
                    {solvedMessages[problem.id] && (
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
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 10
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
                            toggleComplete(problem, listId);
                        }}
                        style={{
                            color: problem.completed ? '#22c55e' : '#e5e5e5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'none',
                            border: 'none',
                            padding: 0
                        }}
                    >
                        <CheckCircle2 size={24} fill={problem.completed ? "#22c55e" : "transparent"} color={problem.completed ? "#fff" : "#e5e5e5"} />
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {/* Line 1: Name */}
                    <div style={{
                        fontSize: '1.1rem',
                        color: isSelfRelevant ? '#333' : '#999',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    {/* Line 2: Details */}
                    {isSelfRelevant && (problem.priority || problem.dueDate) && (
                        <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {problem.priority && (
                                <span style={{ textTransform: 'capitalize' }}>
                                    {problem.priority.replace('_', ' ')}
                                </span>
                            )}
                            {problem.priority && problem.dueDate && <span>&middot;</span>}
                            {problem.dueDate && (
                                <span style={{
                                    color: isOverdue(problem) ? '#ef4444' : 'inherit',
                                    fontWeight: isOverdue(problem) || isDueToday(problem) ? 'bold' : 'normal'
                                }}>
                                    Due {problem.dueDate}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recursion */}
            {isExpanded && hasChildrenRelevant && (
                <div>
                    {problem.subproblems.map(child => (
                        <InternalTaskNode
                            key={child.id}
                            problem={child}
                            listId={listId}
                            depth={depth + 1}
                            toggleComplete={toggleComplete}
                            solvedMessages={solvedMessages}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export default function TodayPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [expandedIds, setExpandedIds] = useState<{ [id: string]: boolean }>({});

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleComplete = (p: Problem, listId: string) => {
        const newCompleted = !p.completed;
        updateProblem(listId, p.id, {
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

    // Filter Logic
    const isOverdue = (p: Problem): boolean => {
        if (p.completed || !p.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = p.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due < today;
    };

    const isDueToday = (p: Problem): boolean => {
        if (p.completed || !p.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = p.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due.getTime() === today.getTime();
    };

    const isDoToday = (p: Problem): boolean => {
        if (p.completed) return false;
        return p.priority === 'today';
    };

    // Recursive Checkers
    // We basically want to know: "Does this node or any descendant match X?"
    const hasMatch = (p: Problem, matcher: (prob: Problem) => boolean): boolean => {
        if (matcher(p)) return true;
        return p.subproblems.some(child => hasMatch(child, matcher));
    };

    // Grouping Helpers
    const getListsWithMatch = (matcher: (prob: Problem) => boolean) => {
        return state.lists.filter(list => list.problems.some(p => hasMatch(p, matcher)));
    };

    // Prepare Sections
    const overdueLists = getListsWithMatch(isOverdue);
    const dueTodayLists = getListsWithMatch(isDueToday);
    const doTodayLists = getListsWithMatch(isDoToday);

    const hasAnyContent = overdueLists.length > 0 || dueTodayLists.length > 0 || doTodayLists.length > 0;

    if (!hasAnyContent) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No tasks for today!</h2>
                <p>You're all caught up.</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <style>{`
                @keyframes fadeOutUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    70% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
                }
            `}</style>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                <span style={{ fontWeight: 600, color: '#333' }}>Today</span>
            </nav>

            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Today</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {/* Overdue Section */}
                {overdueLists.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
                            Overdue
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {overdueLists.map(list => {
                                const isExpanded = expandedIds[`overdue-${list.id}`] || false;
                                return (
                                    <div key={`overdue-${list.id}`}>
                                        <div
                                            onClick={() => toggleExpand(`overdue-${list.id}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                marginBottom: '0.5rem',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRightIcon size={20} />}
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{list.name}</h3>
                                        </div>
                                        {isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {list.problems
                                                    .filter(p => hasMatch(p, isOverdue))
                                                    .map(p => (
                                                        <InternalTaskNode
                                                            key={p.id}
                                                            problem={p}
                                                            listId={list.id}
                                                            depth={0}
                                                            toggleComplete={toggleComplete}
                                                            solvedMessages={solvedMessages}
                                                            expandedIds={expandedIds}
                                                            onToggleExpand={toggleExpand}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Due Today Section */}
                {dueTodayLists.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#f59e0b' }}>
                            Due Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {dueTodayLists.map(list => {
                                const isExpanded = expandedIds[`duetoday-${list.id}`] || false;
                                return (
                                    <div key={`duetoday-${list.id}`}>
                                        <div
                                            onClick={() => toggleExpand(`duetoday-${list.id}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                marginBottom: '0.5rem',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRightIcon size={20} />}
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{list.name}</h3>
                                        </div>
                                        {isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {list.problems
                                                    .filter(p => hasMatch(p, isDueToday))
                                                    .map(p => (
                                                        <InternalTaskNode
                                                            key={p.id}
                                                            problem={p}
                                                            listId={list.id}
                                                            depth={0}
                                                            toggleComplete={toggleComplete}
                                                            solvedMessages={solvedMessages}
                                                            expandedIds={expandedIds}
                                                            onToggleExpand={toggleExpand}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Do Today Section */}
                {doTodayLists.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
                            Do Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {doTodayLists.map(list => {
                                const isExpanded = expandedIds[`dotoday-${list.id}`] || false;
                                return (
                                    <div key={`dotoday-${list.id}`}>
                                        <div
                                            onClick={() => toggleExpand(`dotoday-${list.id}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                marginBottom: '0.5rem',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRightIcon size={20} />}
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{list.name}</h3>
                                        </div>
                                        {isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {list.problems
                                                    .filter(p => hasMatch(p, isDoToday))
                                                    .map(p => (
                                                        <InternalTaskNode
                                                            key={p.id}
                                                            problem={p}
                                                            listId={list.id}
                                                            depth={0}
                                                            toggleComplete={toggleComplete}
                                                            solvedMessages={solvedMessages}
                                                            expandedIds={expandedIds}
                                                            onToggleExpand={toggleExpand}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
