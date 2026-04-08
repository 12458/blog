import { useEffect, useState } from 'react';

export default function ThemeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		setDark(document.documentElement.classList.contains('dark'));
	}, []);

	function toggle() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle('dark', next);
		localStorage.setItem('theme', next ? 'dark' : 'light');
	}

	return (
		<button
			onClick={toggle}
			aria-label="Toggle dark mode"
			style={{
				background: 'none',
				border: 'none',
				cursor: 'pointer',
				fontSize: '1.25rem',
				padding: '0.25rem',
				color: 'var(--text)',
			}}
		>
			{dark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
		</button>
	);
}
