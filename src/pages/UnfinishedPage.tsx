import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'; // Renaming explicitly to avoid conflict/confusion
import type { Problem, List } from '../types';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

export default function UnfinishedPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    // State for collapsed lists functions. Default open? Usually "heading can be collapsed" implies open initially.
    const [collapsedLists, setCollapsedLists] = useState<{ [listId: string]: boolean }>({});

    const toggleListCollapse = (listId: string) => {
        setCollapsedLists(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    // 1. Group tasks by List
    const getUnfinishedTasksByList = (): { list: List, tasks: FlatTask[] }[] => {
        const result: { list: List, tasks: FlatTask[] }[] = [];

        for (const list of state.lists) {
            const listTasks: FlatTask[] = [];

            const traverse = (problems: Problem[], currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
                for (const p of problems) {
                    // Check if status is helping or blocked
                    const isUnfinished = p.status === 'solving' || p.status === 'blocked';

                    if (!p.completed && isUnfinished) {
                        listTasks.push({
                            problem: p,
                            listId: list.id,
                            path: currentPath
                        });
                    }

                    const newPath = [...currentPath, { id: p.id, name: p.name, type: 'problem' as const }];
                    traverse(p.subproblems, newPath);
                }
            };

            traverse(list.problems, [{ id: list.id, name: list.name, type: 'list' }]);

            if (listTasks.length > 0) {
                result.push({ list, tasks: listTasks });
            }
        }

        return result;
    };

    const groupedTasks = getUnfinishedTasksByList();

    const toggleComplete = (p: Problem, listId: string) => {
        const newCompleted = !p.completed;
        updateProblem(listId, p.id, {
            completed: newCompleted,
            status: newCompleted ? 'solved' : 'to_solve' // Default back to 'to_solve' on uncheck? Or keep it solving? 
            // Requirement says "recrsuvie parent update...". But here if we complete it, it's solved.
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

    if (groupedTasks.length === 0) {
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
                {groupedTasks.map(({ list, tasks }) => {
                    const isCollapsed = collapsedLists[list.id];

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
                                <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 'normal' }}>({tasks.length})</span>
                            </div>

                            {!isCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
                                    {tasks.map(({ problem, listId, path }) => (
                                        <div
                                            key={problem.id}
                                            onClick={() => navigate(`/list/${listId}/problem/${problem.id}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '1rem',
                                                borderBottom: '1px solid #f0f0f0',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                borderRadius: '8px',
                                                backgroundColor: problem.status === 'blocked' ? '#fff1f1' : 'transparent', // Subtle red tint for blocked?
                                                // Or maybe just a badge.
                                            }}
                                            onMouseEnter={(e) => {
                                                if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = '#f9f9f9';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        color: '#333',
                                                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {problem.name}
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: '600',
                                                        backgroundColor: problem.status === 'blocked' ? '#fee2e2' : '#dbeafe',
                                                        color: problem.status === 'blocked' ? '#ef4444' : '#3b82f6',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {problem.status}
                                                    </span>
                                                </div>

                                                {/* Path */}
                                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#888' }} onClick={e => e.stopPropagation()}>
                                                    {path.map((crumb, index) => {
                                                        const linkPath = crumb.type === 'list'
                                                            ? `/list/${crumb.id}`
                                                            : `/list/${listId}/problem/${crumb.id}`;

                                                        return (
                                                            <React.Fragment key={index}>
                                                                {index > 0 && <ChevronRight size={12} />}
                                                                <Link
                                                                    to={linkPath}
                                                                    style={{ color: '#888', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                                                                    onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid #888'}
                                                                    onMouseLeave={e => e.currentTarget.style.borderBottom = '1px solid transparent'}
                                                                >
                                                                    {crumb.name}
                                                                </Link>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
