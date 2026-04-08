import Giscus from '@giscus/react';
import { useEffect, useState } from 'react';
import { GISCUS_CONFIG } from '@/consts';

export default function GiscusComments() {
	const [theme, setTheme] = useState('light');

	useEffect(() => {
		const isDark = document.documentElement.classList.contains('dark');
		setTheme(isDark ? 'dark' : 'light');

		const observer = new MutationObserver(() => {
			const isDark = document.documentElement.classList.contains('dark');
			setTheme(isDark ? 'dark' : 'light');
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => observer.disconnect();
	}, []);

	return (
		<Giscus
			repo={GISCUS_CONFIG.repo}
			repoId={GISCUS_CONFIG.repoId}
			category={GISCUS_CONFIG.category}
			categoryId={GISCUS_CONFIG.categoryId}
			mapping={GISCUS_CONFIG.mapping}
			reactionsEnabled={GISCUS_CONFIG.reactionsEnabled as '0' | '1'}
			emitMetadata={GISCUS_CONFIG.emitMetadata as '0' | '1'}
			inputPosition={GISCUS_CONFIG.inputPosition}
			theme={theme}
			lang={GISCUS_CONFIG.lang}
			loading="lazy"
		/>
	);
}
