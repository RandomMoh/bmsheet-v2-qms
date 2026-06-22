import { useEffect, useState } from 'react';

function Icon({ paths, size = 16, style = {} }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={style}>
            {(Array.isArray(paths) ? paths : [paths]).map((d, i) => <path key={i} d={d} />)}
        </svg>
    );
}

const IC_MOON = ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'];
const IC_SUN = [
    'M12 1v2', 'M12 21v2', 'M4.22 4.22l1.42 1.42', 'M18.36 18.36l1.42 1.42',
    'M1 12h2', 'M21 12h2', 'M4.22 19.78l1.42-1.42', 'M18.36 5.64l1.42-1.42',
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'
];

function getInitialTheme() {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    return false;
}

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(getInitialTheme);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);

    return (
        <button
            onClick={toggle}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
                background: 'var(--bg-sunken)',
                border: '1.5px solid var(--border-subtle)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 5,
                borderRadius: 'var(--radius-md, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
            }}
        >
            <Icon paths={isDark ? IC_SUN : IC_MOON} size={14} />
        </button>
    );
}
