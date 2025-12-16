import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { Problem } from '../types';

interface FocusSessionProps {
    problem: Problem;
    onExit: () => void;
    onUpdateProblem: (id: string, updates: Partial<Problem>) => void;
}

type TimerMode = '5min' | 'pomodoro' | 'stopwatch';
type TimerState = 'idle' | 'running' | 'paused';
type PomoPhase = 'work' | 'break' | 'long_break';

export default function FocusSession({ problem, onExit, onUpdateProblem }: FocusSessionProps) {
    const [mode, setMode] = useState<TimerMode | null>(null);
    const [timerState, setTimerState] = useState<TimerState>('idle');
    const [timeLeft, setTimeLeft] = useState(0); // For countdowns (ms)
    const [stopwatchTime, setStopwatchTime] = useState(0); // For stopwatch (ms)

    // New state to decouple total time tracking from active timer
    const [isTotalTimeRunning, setIsTotalTimeRunning] = useState(false);

    // Pomodoro State
    const [pomoPhase, setPomoPhase] = useState<PomoPhase>('work');
    const [pomoCycles, setPomoCycles] = useState(0);

    // Session Total Time Tracking
    // Display = (problem.totalTime || 0) + sessionDuration
    const [currentSessionDuration, setCurrentSessionDuration] = useState(0);

    // Audio Context for Beeps
    const audioContextRef = useRef<AudioContext | null>(null);

    const playBeep = useCallback((count = 1) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        const playTone = (i: number) => {
            if (i <= 0) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);

            setTimeout(() => playTone(i - 1), 600);
        };

        playTone(count);
    }, []);

    // 1. Continuous Session Time Tracker
    // Discrete Session Recording: Track start time of current active segment
    const sessionStartTimeRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(Date.now());

    // Helper to commit current session segment
    const commitSession = useCallback(() => {
        if (sessionStartTimeRef.current) {
            const now = Date.now();
            const start = sessionStartTimeRef.current;
            const duration = now - start;

            if (duration > 0) {
                const newSession = {
                    startTime: start,
                    endTime: now,
                    duration: duration
                };

                const currentSessions = problem.sessions || [];
                const newSessions = [...currentSessions, newSession];
                const newTotalTime = (problem.totalTime || 0) + duration;

                onUpdateProblem(problem.id, {
                    totalTime: newTotalTime,
                    sessions: newSessions
                });
            }
            sessionStartTimeRef.current = null;
        }
    }, [problem.id, problem.sessions, problem.totalTime, onUpdateProblem]);

    useEffect(() => {
        // Track if isTotalTimeRunning is true and problem is not completed
        if (!isTotalTimeRunning || problem.completed) {
            // Stopped: Commit any active session
            if (sessionStartTimeRef.current) {
                commitSession();
            }
            return;
        }

        // Started
        if (!sessionStartTimeRef.current) {
            sessionStartTimeRef.current = Date.now();
        }

        // Auto-update status to 'solving' if it's currently 'to_solve' or undefined
        if (!problem.status || problem.status === 'to_solve') {
            console.log('FocusSession: Auto-updating status to solving');
            onUpdateProblem(problem.id, { status: 'solving' });
        }

        lastTimeRef.current = Date.now(); // Reset anchor on resume/start
        setCurrentSessionDuration(0); // Reset local display tracker for new segment

        const interval = setInterval(() => {
            const now = Date.now();
            // Just track accurate delta since start of this segment for display
            if (sessionStartTimeRef.current) {
                setCurrentSessionDuration(now - sessionStartTimeRef.current);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isTotalTimeRunning, problem.completed, problem.status, problem.id, onUpdateProblem, commitSession]);

    // 2. Timer Logic (Countdown & Stopwatch)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (timerState === 'running') {
            const tickRate = 1000;

            interval = setInterval(() => {
                if (mode === 'stopwatch') {
                    setStopwatchTime(prev => prev + 1000);
                } else {
                    // Countdown
                    setTimeLeft(prev => {
                        if (prev <= 1000) {
                            // Timer Finished
                            playBeep(3);

                            // Note: We pause the TIMER (countdown), but we DO NOT stop isTotalTimeRunning
                            // This allows total time to keep accumulating as requested.

                            if (mode === 'pomodoro') {
                                setTimerState('paused');
                                if (pomoPhase === 'work') {
                                    const newCycles = pomoCycles + 1;
                                    setPomoCycles(newCycles);
                                    if (newCycles % 4 === 0) {
                                        setPomoPhase('long_break');
                                        return 15 * 60 * 1000;
                                    } else {
                                        setPomoPhase('break');
                                        return 5 * 60 * 1000;
                                    }
                                } else {
                                    setPomoPhase('work');
                                    return 25 * 60 * 1000;
                                }
                            } else {
                                setTimerState('paused');
                                return 0;
                            }
                        }
                        return prev - 1000;
                    });
                }
            }, tickRate);
        }

        return () => clearInterval(interval);
    }, [timerState, mode, pomoPhase, pomoCycles, playBeep]);


    // Save total time on exit
    // Save total time on exit
    const handleExit = () => {
        // Commit any running session first
        if (sessionStartTimeRef.current) {
            commitSession();
        }
        onExit();
    };

    // Format Time: HH:MM:SS or MM:SS
    const formatTime = (ms: number, includeHours = false) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (includeHours || hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const start5Min = () => {
        setMode('5min');
        setTimeLeft(5 * 60 * 1000);
        setTimerState('running');
        setIsTotalTimeRunning(true);
    };

    const startPomodoro = () => {
        setMode('pomodoro');
        setTimeLeft(25 * 60 * 1000);
        setPomoPhase('work');
        setPomoCycles(0);
        setTimerState('idle');
        setIsTotalTimeRunning(false); // Waits for play
    };

    const startStopwatch = () => {
        setMode('stopwatch');
        setStopwatchTime(0);
        setTimerState('running');
        setIsTotalTimeRunning(true);
    };

    const toggleTimer = () => {
        setTimerState(prev => {
            const nextState = prev === 'running' ? 'paused' : 'running';
            // Sync total time with user interaction
            setIsTotalTimeRunning(nextState === 'running');
            return nextState;
        });
    };

    const resetTimer = () => {
        setTimerState('idle');
        // Do not stop total time on reset, as per user request
        if (mode === '5min') setTimeLeft(5 * 60 * 1000);
        if (mode === 'stopwatch') setStopwatchTime(0);
        if (mode === 'pomodoro') {
            if (pomoPhase === 'work') setTimeLeft(25 * 60 * 1000);
            else if (pomoPhase === 'break') setTimeLeft(5 * 60 * 1000);
            else setTimeLeft(15 * 60 * 1000);
        }
    };

    // Toggle Solved
    const handleToggleSolved = () => {
        const newCompleted = !problem.completed;

        onUpdateProblem(problem.id, {
            completed: newCompleted,
            status: newCompleted ? 'solved' : 'to_solve'
        });

        if (newCompleted) {
            setTimerState('paused'); // Stop countdown
            setIsTotalTimeRunning(false); // Stop total time
        }
    };

    // Render Selection Screen
    if (!mode) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Focus Mode</h2>
                        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={24} color="#666" />
                        </button>
                    </div>

                    <p style={{ margin: 0, color: '#666', lineHeight: 1.5 }}>
                        Select a timer mode to focus on <strong>{problem.name}</strong>.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={start5Min}
                            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e5e5e5', backgroundColor: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e5e5'}
                        >
                            5 Minutes
                        </button>
                        <button
                            onClick={startPomodoro}
                            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e5e5e5', backgroundColor: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#fca5a5'} // light red hint
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e5e5'}
                        >
                            Pomodoro
                        </button>
                        <button
                            onClick={startStopwatch}
                            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e5e5e5', backgroundColor: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e5e5'}
                        >
                            Stopwatch
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active Focus Session UI
    const totalAccumulatedTime = (problem.totalTime || 0) + currentSessionDuration;

    // Display Time
    let mainDisplayTime = 0;
    if (mode === 'stopwatch') mainDisplayTime = stopwatchTime;
    else mainDisplayTime = timeLeft;

    const isResetDisabled = timerState === 'running' && mode !== 'stopwatch' && timeLeft > 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1a1a1a', // Dark mode background as per request/image
            color: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Close Button */}
            <button
                onClick={handleExit}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888',
                    padding: '8px'
                }}
            >
                <X size={32} />
            </button>

            {/* Task Name */}
            <h1 style={{
                fontSize: '2rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                textAlign: 'center',
                maxWidth: '80%',
                lineHeight: 1.3
            }}>
                {problem.name}
            </h1>

            {/* Total Elapsed Time */}
            <div style={{ color: '#666', fontSize: '1rem', fontFamily: 'monospace', marginBottom: '4rem' }}>
                {formatTime(totalAccumulatedTime, true)}
            </div>

            {/* Main Timer */}
            <div style={{
                position: 'relative',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '8px solid #333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4rem',
                backgroundColor: '#222'
            }}>
                {/* Progress Ring? Maybe too complex for now, user just asked for timer in middle. */}
                <div style={{ fontSize: '4rem', fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(mainDisplayTime, mode === 'stopwatch' || mainDisplayTime >= 3600000)}
                </div>

                {/* Pomodoro Phase Indicator */}
                {mode === 'pomodoro' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {pomoPhase.replace('_', ' ')}
                    </div>
                )}

                {/* Controls inside the circle as per image */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        onClick={toggleTimer}
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#38bdf8', // Cyan/Blue like image
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#000'
                        }}
                    >
                        {timerState === 'running' ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        disabled={isResetDisabled} // Disabled while counting down
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#333',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isResetDisabled ? 'not-allowed' : 'pointer',
                            color: isResetDisabled ? '#555' : '#fff',
                            opacity: isResetDisabled ? 0.5 : 1
                        }}
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Mark as Solved */}
            <button
                onClick={handleToggleSolved}
                style={{
                    padding: '0.8rem 2rem',
                    borderRadius: '999px',
                    backgroundColor: 'transparent',
                    border: '1px solid #444',
                    color: problem.completed ? '#22c55e' : '#888',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginBottom: '2rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
            >
                {problem.completed ? <CheckCircle2 size={20} /> : null}
                {problem.completed ? 'Solved!' : 'Mark as Solved'}
            </button>

            {/* End Session Link */}
            <button
                onClick={handleExit}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textDecoration: 'underline'
                }}
            >
                End focus session
            </button>
        </div>
    );
}
