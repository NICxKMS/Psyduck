import React from 'react';

interface TheiaIDEProps {
	url: string;
	className?: string;
}

export const TheiaIDE: React.FC<TheiaIDEProps> = ({ url, className }) => {
	const src = url.endsWith('/') ? url.slice(0, -1) : url;
	return (
		<div className={className} style={{ height: '100vh' }}>
			<iframe
				title="Eclipse Theia"
				src={`${src}/`}
				style={{ width: '100%', height: '100%', border: 'none' }}
				allow="clipboard-read; clipboard-write; fullscreen"
			/>
		</div>
	);
};

export default TheiaIDE;




