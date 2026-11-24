<script lang="ts">
	import { cn } from '../cn/index.js';

	let { value, size, tone = 'accent' }: {
		value: string;
		size: 'sm' | 'md' | 'lg';
		tone?: 'accent' | 'reading';
	} = $props();

	const valueClass = {
		sm: 'text-subheading',
		md: 'text-heading',
		lg: 'text-title',
	} as const;
</script>

<span
	class={cn(
		'metric-value font-heading font-extrabold leading-none tabular-nums',
		valueClass[size],
		tone === 'reading' ? 'text-foreground' : 'text-accent-text',
	)}>{value}</span
>
