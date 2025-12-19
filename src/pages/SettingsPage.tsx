import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layout, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function SettingsPage() {
    const { state, updateSettings } = useStore();
    const layout = state.settings?.layout || 'single-column';

    useEffect(() => {
        document.title = 'Problems Settings';
    }, []);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                <span style={{ fontWeight: 600, color: '#333' }}>Settings</span>
            </nav>

            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Layout Setting */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Layout size={20} color="#333" />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Layout</h2>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1.5rem',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0'
                    }}>
                        <button
                            onClick={() => updateSettings({ layout: 'single-column' })}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '8px',
                                border: `2px solid ${layout === 'single-column' ? '#333' : '#e5e5e5'}`,
                                backgroundColor: layout === 'single-column' ? '#f9fafb' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%', height: '80px', backgroundColor: '#e5e5e5', borderRadius: '4px' }}>
                                <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', height: '10px', backgroundColor: '#ccc', borderRadius: '2px' }} />
                                <div style={{ position: 'absolute', top: '30%', left: '10%', right: '10%', bottom: '10%', backgroundColor: '#fff', borderRadius: '2px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#333' }}>
                                {layout === 'single-column' && <Check size={16} />}
                                Single column
                            </div>
                        </button>

                        <button
                            onClick={() => updateSettings({ layout: 'two-columns' })}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '8px',
                                border: `2px solid ${layout === 'two-columns' ? '#333' : '#e5e5e5'}`,
                                backgroundColor: layout === 'two-columns' ? '#f9fafb' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%', height: '80px', backgroundColor: '#e5e5e5', borderRadius: '4px', display: 'flex', gap: '4px', padding: '4px' }}>
                                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '2px', border: '1px solid #ddd' }} />
                                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '2px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#333' }}>
                                {layout === 'two-columns' && <Check size={16} />}
                                Two columns
                            </div>
                        </button>
                    </div>
                </section>

                {/* Default View Setting */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Layout size={20} color="#333" />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Default View</h2>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                        Choose which page opens when you start the app or click Home.
                    </p>

                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0'
                    }}>
                        <select
                            value={state.settings.defaultView || 'inbox'}
                            onChange={(e) => updateSettings({ defaultView: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '1rem',
                                backgroundColor: '#fff',
                                color: '#333',
                                cursor: 'pointer'
                            }}
                        >
                            <optgroup label="System Views">
                                <option value="inbox">📥 Inbox</option>
                                <option value="today">📅 Today</option>
                                <option value="week">📅 This Week</option>
                                <option value="upcoming">🗓️ Upcoming</option>
                            </optgroup>
                            {state.lists.length > 1 && (
                                <optgroup label="My Lists">
                                    {state.lists.filter(l => l.id !== 'inbox').map(list => (
                                        <option key={list.id} value={list.id}>
                                            {list.emoji ? `${list.emoji} ${list.name}` : list.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                </section>

            </div>
        </div>
    );
}
