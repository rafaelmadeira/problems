import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';

export default function HomePage() {
    const { state, addList, reorderLists } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            addList(newListName.trim());
            setNewListName('');
            setIsCreating(false);
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newLists = [...state.lists];
        const draggedItem = newLists[draggedIndex];

        // Remove dragged item
        newLists.splice(draggedIndex, 1);
        // Insert at new position
        newLists.splice(targetIndex, 0, draggedItem);

        reorderLists(newLists);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {state.lists.filter(l => l.id !== 'inbox').map((list, index) => {
                    const count = list.problems.length;
                    return (
                        <div
                            key={list.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            style={{
                                cursor: 'move' // Indicate draggable
                            }}
                        >
                            <Link
                                to={`/list/${list.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1.5rem',
                                    backgroundColor: draggedIndex === index ? '#f0f0f0' : '#f9f9f9', // Visual feedback
                                    borderRadius: '12px',
                                    transition: 'background-color 0.2s',
                                    opacity: draggedIndex === index ? 0.5 : 1 // Dim dragged item
                                }}
                                onMouseEnter={(e) => {
                                    if (draggedIndex === null) e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                    if (draggedIndex === null) e.currentTarget.style.backgroundColor = '#f9f9f9';
                                }}
                            >
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{list.name}</h2>
                                    {list.description && <p style={{ color: '#888', marginTop: '0.25rem' }}>{list.description}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {count > 0 && (
                                        <span style={{
                                            backgroundColor: '#e5e5e5',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            {count}
                                        </span>
                                    )}
                                    <ChevronRight size={20} color="#ccc" />
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem' }}>
                {isCreating ? (
                    <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="List name..."
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            style={{
                                fontSize: '1.25rem',
                                borderBottom: '2px solid #333',
                                padding: '0.5rem',
                                flex: 1
                            }}
                            onBlur={() => !newListName && setIsCreating(false)}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                borderRadius: '8px',
                                fontWeight: '600'
                            }}
                        >
                            Add
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            padding: '0.5rem 0'
                        }}
                    >
                        <Plus size={20} />
                        <span>New list</span>
                    </button>
                )}
            </div>
        </div>
    );
}
