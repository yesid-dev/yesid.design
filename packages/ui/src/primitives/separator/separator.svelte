<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Separator as SeparatorTypes } from 'bits-ui';
	import type { WithElementRef } from '../../cn/index.js';

	export type SeparatorVariant = 'default' | 'hazard' | 'gradient' | 'dimension' | 'hand-drawn';
	export type HazardSize = 'sm' | 'md' | 'lg';

	type CustomSeparatorElementProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	> & {
		orientation?: 'horizontal' | 'vertical';
		child?: never;
		children?: never;
		decorative?: never;
	};

	type SeparatorDefaultProps = SeparatorTypes.RootProps & {
		variant?: 'default';
		hazardSize?: never;
		hazardAngle?: never;
		maxWidth?: never;
		label?: never;
	};

	type SeparatorHazardProps = CustomSeparatorElementProps & {
		variant: 'hazard';
		hazardSize?: HazardSize;
		hazardAngle?: number;
		maxWidth?: string;
		label?: string;
	};

	type SeparatorGradientProps = CustomSeparatorElementProps & {
		variant: 'gradient';
		hazardSize?: never;
		hazardAngle?: never;
		maxWidth?: string;
		label?: string;
	};

	/**
	 * THE divider (D22): a drafting dimension line in the blueprint ink, 1px with end ticks and
	 * scale ticks every 80px, full width, horizontal only, decorative and static. Drawn by the
	 * `.dimension-line` class in `@yesid/ui/base.css`.
	 */
	type SeparatorDimensionProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	> & {
		variant: 'dimension';
		orientation?: never;
		child?: never;
		children?: never;
		decorative?: never;
		hazardSize?: never;
		hazardAngle?: never;
		maxWidth?: never;
		label?: never;
	};

	/**
	 * The owner's hand-drawn divider (D22, 16 November 2026): one slightly irregular orange stroke,
	 * as if drawn with a pen on the blueprint paper, edge to edge in the blueprint ink
	 * (`--primary`), 8px tall, horizontal only, decorative and static.
	 */
	type SeparatorHandDrawnProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	> & {
		variant: 'hand-drawn';
		orientation?: never;
		child?: never;
		children?: never;
		decorative?: never;
		hazardSize?: never;
		hazardAngle?: never;
		maxWidth?: never;
		label?: never;
	};

	export type SeparatorProps =
		| SeparatorDefaultProps
		| SeparatorHazardProps
		| SeparatorGradientProps
		| SeparatorDimensionProps
		| SeparatorHandDrawnProps;
</script>

<script lang="ts">
	import { Separator as SeparatorPrimitive } from 'bits-ui';
	import { cn } from '../../cn/index.js';

	let { ref = $bindable(null), ...separatorProps }: SeparatorProps = $props();

	// Decorative only: hidden from assistive technology and without a role (D22). Passed as one
	// object because Svelte's checker flags `aria-hidden` beside `role="none"`, a valid ARIA pair.
	const decorativeAttributes = { role: 'none', 'aria-hidden': 'true' } as const;

	const stripeWidth = { sm: 6, md: 8, lg: 12 } as const;
	const hazardHeightClass = { sm: 'h-[3px]', md: 'h-1.5', lg: 'h-2.5' } as const;
	const hazardWidthClass = { sm: 'w-[3px]', md: 'w-1.5', lg: 'w-2.5' } as const;

	// Hazard = real safety tape: yellow (--hazard-a) + warm black (--hazard-b),
	// theme-invariant tokens so the tape never reskins when the lights change.
	function getHazardGradient(angle: number, size: HazardSize): string {
		return `repeating-linear-gradient(${angle}deg, var(--hazard-a) 0px, var(--hazard-a) ${stripeWidth[size]}px, var(--hazard-b) ${stripeWidth[size]}px, var(--hazard-b) ${stripeWidth[size] * 2}px)`;
	}

	function getHazardProps(props: SeparatorHazardProps) {
		const {
			variant,
			hazardSize = 'md',
			hazardAngle = -45,
			maxWidth = 'none',
			label,
			orientation = 'horizontal',
			child,
			children,
			decorative,
			class: className,
			style,
			'data-slot': dataSlot = 'separator',
			...nativeProps
		} = props;
		void variant;
		void child;
		void children;
		void decorative;
		return {
			hazardSize,
			maxWidth,
			label,
			isVertical: orientation === 'vertical',
			className,
			style,
			dataSlot,
			hazardGradient: getHazardGradient(hazardAngle, hazardSize),
			nativeProps,
		};
	}

	function getGradientProps(props: SeparatorGradientProps) {
		const {
			variant,
			hazardSize,
			hazardAngle,
			maxWidth = 'var(--width-content)',
			label,
			orientation,
			child,
			children,
			decorative,
			class: className,
			style,
			'data-slot': dataSlot = 'separator',
			...nativeProps
		} = props;
		void variant;
		void hazardSize;
		void hazardAngle;
		void orientation;
		void child;
		void children;
		void decorative;
		return { maxWidth, label, className, style, dataSlot, nativeProps };
	}

	function getDimensionProps(props: SeparatorDimensionProps) {
		const {
			variant,
			orientation,
			child,
			children,
			decorative,
			hazardSize,
			hazardAngle,
			maxWidth,
			label,
			class: className,
			'data-slot': dataSlot = 'separator',
			...nativeProps
		} = props;
		void variant;
		void orientation;
		void child;
		void children;
		void decorative;
		void hazardSize;
		void hazardAngle;
		void maxWidth;
		void label;
		return { className, dataSlot, nativeProps };
	}

	function getHandDrawnProps(props: SeparatorHandDrawnProps) {
		const {
			variant,
			orientation,
			child,
			children,
			decorative,
			hazardSize,
			hazardAngle,
			maxWidth,
			label,
			class: className,
			'data-slot': dataSlot = 'separator',
			...nativeProps
		} = props;
		void variant;
		void orientation;
		void child;
		void children;
		void decorative;
		void hazardSize;
		void hazardAngle;
		void maxWidth;
		void label;
		return { className, dataSlot, nativeProps };
	}

	function getDefaultProps(props: SeparatorDefaultProps) {
		const {
			variant,
			hazardSize,
			hazardAngle,
			maxWidth,
			label,
			class: className,
			'data-slot': dataSlot = 'separator',
			...rootProps
		} = props;
		void variant;
		void hazardSize;
		void hazardAngle;
		void maxWidth;
		void label;
		return { className, dataSlot, rootProps };
	}
</script>

{#if separatorProps.variant === 'hazard'}
	{@const hazard = getHazardProps(separatorProps)}
	{#if hazard.label}
		<div
			{...hazard.nativeProps}
			bind:this={ref}
			data-slot={hazard.dataSlot}
			class={cn('flex items-center gap-3', hazard.className)}
			style={hazard.style}
			style:max-width={hazard.maxWidth}
			aria-hidden="true"
		>
			<div
				class={cn(hazardHeightClass[hazard.hazardSize], 'flex-1 rounded-sm')}
				style:background={hazard.hazardGradient}
			></div>
			<span class="label-station shrink-0">{hazard.label}</span>
			<div
				class={cn(hazardHeightClass[hazard.hazardSize], 'flex-1 rounded-sm')}
				style:background={hazard.hazardGradient}
			></div>
		</div>
	{:else}
		<div
			{...hazard.nativeProps}
			bind:this={ref}
			data-slot={hazard.dataSlot}
			class={cn(
				hazard.isVertical
					? [hazardWidthClass[hazard.hazardSize], 'h-full rounded-sm']
					: [hazardHeightClass[hazard.hazardSize], 'w-full rounded-sm'],
				hazard.className,
			)}
			style={hazard.style}
			style:max-width={hazard.maxWidth}
			style:background={hazard.hazardGradient}
			aria-hidden="true"
		></div>
	{/if}
{:else if separatorProps.variant === 'dimension'}
	{@const dimension = getDimensionProps(separatorProps)}
	<div
		{...dimension.nativeProps}
		bind:this={ref}
		data-slot={dimension.dataSlot}
		data-variant="dimension"
		class={cn('dimension-line', dimension.className)}
		{...decorativeAttributes}
	></div>
{:else if separatorProps.variant === 'hand-drawn'}
	{@const handDrawn = getHandDrawnProps(separatorProps)}
	<div
		{...handDrawn.nativeProps}
		bind:this={ref}
		data-slot={handDrawn.dataSlot}
		data-variant="hand-drawn"
		class={cn('hand-drawn-line', handDrawn.className)}
		{...decorativeAttributes}
	>
		<!-- One pen stroke: a gentle wobble at most 1px off true, round caps and a stroke that
		     never scales (vector-effect), stretched to any width. Ink is the wrapper's currentColor. -->
		<svg
			class="hand-drawn-line-art"
			viewBox="0 0 1000 8"
			preserveAspectRatio="none"
			focusable="false"
			aria-hidden="true"
		>
			<path
				d="M1.5 4.6C60 3.4 120 3.5 190 4.3S310 5.4 400 4.5S520 3 610 3.8S760 5.3 850 4.6S960 3.4 998.5 3.9"
				fill="none"
				stroke="currentColor"
				stroke-width="1.25"
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
	</div>
{:else if separatorProps.variant === 'gradient'}
	{@const gradient = getGradientProps(separatorProps)}
	<div
		{...gradient.nativeProps}
		bind:this={ref}
		data-slot={gradient.dataSlot}
		class={cn('relative mx-auto w-full py-4', gradient.className)}
		style={gradient.style}
		style:max-width={gradient.maxWidth}
		aria-hidden="true"
	>
		<div class="gradient-separator-line" data-testid="gradient-separator"></div>
		{#if gradient.label}
			<div class="label-station mt-2" data-testid="separator-label">{gradient.label}</div>
		{/if}
	</div>
{:else}
	{@const separator = getDefaultProps(separatorProps)}
	<SeparatorPrimitive.Root
		{...separator.rootProps}
		bind:ref
		data-slot={separator.dataSlot}
		class={cn(
			'shrink-0 bg-border-subtle data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
			separator.className,
		)}
	/>
{/if}

<style>
	/* Brand chrome line, orange to yellow. Decorative branding, not a data
	   mark, so --primary/--accent are doctrine-compliant here. */
	.gradient-separator-line {
		height: 2px;
		border-radius: var(--radius-pill);
		background: linear-gradient(
			90deg,
			var(--primary),
			var(--accent)
		);
		background-size: 100% 100%;
	}
</style>
