import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronRight, Plus, CheckCircle2, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Problem } from '../types';

export default function ProblemPage() {
    const { listId, problemId } = useParams();
    const navigate = useNavigate();
    const { state, addProblem, updateProblem, updateList, deleteList, deleteProblem, reorderProblems } = useStore();

    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    const currentParentId = currentProblem ? currentProblem.id : null;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskName.trim()) {
            addProblem(currentParentId, list.id, newSubtaskName.trim());
            setNewSubtaskName('');
            setIsAdding(false);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentProblem) {
            updateProblem(list.id, currentProblem.id, { notes: e.target.value });
        }
    };

    const toggleComplete = (p: Problem) => {
        updateProblem(list.id, p.id, { completed: !p.completed });
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

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newProblems = [...subElements];
        const draggedItem = newProblems[draggedIndex];

        // Remove dragged item
        newProblems.splice(draggedIndex, 1);
        // Insert at new position
        newProblems.splice(targetIndex, 0, draggedItem);

        reorderProblems(list.id, currentParentId, newProblems);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }} onClick={() => setIsMenuOpen(false)}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                {!currentProblem ? (
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{list.name}</span>
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
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{currentProblem.name}</span>
                    </>
                )}
            </nav>

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
                                onChange={(e) => updateList(list.id, { description: e.target.value })}
                                placeholder="Description..."
                                maxLength={500}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    fontSize: '1rem',
                                    color: '#555',
                                    resize: 'none',
                                    lineHeight: '1.6',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={currentProblem.name}
                                onChange={(e) => updateProblem(list.id, currentProblem!.id, { name: e.target.value })}
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
                                value={currentProblem.notes || ''}
                                onChange={handleNotesChange}
                                placeholder="Notes..."
                                maxLength={500}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    fontSize: '1rem',
                                    color: '#555',
                                    resize: 'none',
                                    lineHeight: '1.6',
                                    border: 'none', // Make notes cleaner too
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit'
                                }}
                            />
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
                                display: 'flex',
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subElements.map((child, index) => {
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
                                cursor: 'pointer', // Indicates clickable. 'move' cursor on drag area would be better but this is fine for now.
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
                                <button
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
                                        color: '#333'
                                    }}>
                                        {childCount}
                                    </span>
                                )}
                                <Link
                                    to={`/list/${list.id}/problem/${child.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ChevronRight size={20} color="#e5e5e5" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem' }}>
                {isAdding ? (
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="New task..."
                            value={newSubtaskName}
                            onChange={e => setNewSubtaskName(e.target.value)}
                            style={{
                                fontSize: '1.1rem',
                                borderBottom: '2px solid #333',
                                padding: '0.5rem',
                                flex: 1,
                                fontFamily: 'inherit'
                            }}
                            onBlur={() => !newSubtaskName && setIsAdding(false)}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontFamily: 'inherit'
                            }}
                        >
                            Add
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            padding: '0.5rem 0',
                            fontFamily: 'inherit'
                        }}
                    >
                        <Plus size={20} />
                        <span>New task</span>
                    </button>
                )}
            </div>
        </div>
    );
}
