import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import type { Problem, List } from '../types';

/* 
  Recursive component for rendering a task and its children 
  Only renders if the task itself is unfinished OR has unfinished children.
*/
const TaskNode = ({
    problem,
    listId,
    depth = 0,
    toggleComplete,
    solvedMessages
}: {
    problem: Problem,
    listId: string,
    depth?: number,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean }
}) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Filter relevant children: must be incomplete and (solving/blocked OR have relevant children)
    // Wait, the requirement says "display all tasks with either 'solving' or 'blocked'".
    // What if a child is 'solving' but parent is 'to_solve'? 
    // Usually we show the tree context. The prompt says "parent/children tasks are displayed in a collapsible tree".
    // I will include children if they themselves match condition OR recursively have matching children.

    // Helper to check if a problem or its descendants match the filter
    const hasUnfinishedDescendants = (p: Problem): boolean => {
        if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) return true;
        return p.subproblems.some(child => hasUnfinishedDescendants(child));
    };

    // Current node matches?
    const isSelfUnfinished = !problem.completed && (problem.status === 'solving' || problem.status === 'blocked');
    const hasRelevantChildren = problem.subproblems.some(child => hasUnfinishedDescendants(child));

    // If neither self nor children match, don't render (should have been filtered by parent, but safety check)
    if (!isSelfUnfinished && !hasRelevantChildren) return null;

    return (
        <div style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
            {/* Render Self if matches */}
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
                    backgroundColor: problem.status === 'blocked' ? '#fff1f1' : 'transparent',
                }}
                onMouseEnter={(e) => {
                    if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseLeave={(e) => {
                    if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {/* Collapse Toggle for children */}
                {hasRelevantChildren ? (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(!isCollapsed);
                        }}
                        style={{ padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {isCollapsed ? <ChevronRightIcon size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
                    </div>
                ) : (
                    // Spacer
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

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '1.1rem',
                        color: isSelfUnfinished ? '#333' : '#999', // Dim if just a container for children
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    {/* Metadata line: Priority · Status */}
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>
                            {problem.priority?.replace('_', ' ') || 'someday'}
                        </span>
                        <span>&middot;</span>
                        <span style={{
                            textTransform: 'capitalize',
                            color: problem.status === 'blocked' ? '#ef4444' :
                                problem.status === 'solving' ? '#3b82f6' : '#888'
                        }}>
                            {/* If 'to_solve' but shown because children, show that? Or just status? */}
                            {problem.status || 'to solve'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recursively render children if not collapsed */}
            {!isCollapsed && hasRelevantChildren && (
                <div>
                    {problem.subproblems
                        .filter(child => hasUnfinishedDescendants(child))
                        .map(child => (
                            <TaskNode
                                key={child.id}
                                problem={child}
                                listId={listId}
                                depth={depth + 1}
                                toggleComplete={toggleComplete}
                                solvedMessages={solvedMessages}
                            />
                        ))
                    }
                </div>
            )}
        </div>
    );
};


export default function UnfinishedPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    const [collapsedLists, setCollapsedLists] = useState<{ [listId: string]: boolean }>({});

    const toggleListCollapse = (listId: string) => {
        setCollapsedLists(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    // Helper: Check if list has any relevant tasks
    const hasUnfinishedDescendants = (p: Problem): boolean => {
        if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) return true;
        return p.subproblems.some(child => hasUnfinishedDescendants(child));
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

    // Filter lists that have at least one matching task
    const visibleLists = state.lists.filter(list =>
        list.problems.some(p => hasUnfinishedDescendants(p))
    );

    if (visibleLists.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No unfinished tasks!</h2>
                <p>You're clear on active work.</p>
            </div>
        );
    }

    return (
        <div>
            <style>{`
                @keyframes fadeOutUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    70% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
                }
            `}</style>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Unfinished</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {visibleLists.map(list => {
                    const isCollapsed = collapsedLists[list.id];
                    // Count only strictly matching tasks for the list header count? Or all nodes shown?
                    // User said "Unfinished... button... display all tasks with...".
                    // Let's count strictly matching.
                    const countStrict = (problems: Problem[]): number => {
                        let c = 0;
                        for (const p of problems) {
                            if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) c++;
                            c += countStrict(p.subproblems);
                        }
                        return c;
                    };
                    const unfinishedCount = countStrict(list.problems);

                    return (
                        <div key={list.id}>
                            <div
                                onClick={() => toggleListCollapse(list.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    marginBottom: '1rem',
                                    userSelect: 'none'
                                }}
                            >
                                {isCollapsed ? <ChevronRightIcon size={20} /> : <ChevronDown size={20} />}
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{list.name}</h2>
                                <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 'normal' }}>({unfinishedCount})</span>
                            </div>

                            {!isCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {list.problems
                                        .filter(p => hasUnfinishedDescendants(p))
                                        .map(p => (
                                            <TaskNode
                                                key={p.id}
                                                problem={p}
                                                listId={list.id}
                                                toggleComplete={toggleComplete}
                                                solvedMessages={solvedMessages}
                                            />
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
