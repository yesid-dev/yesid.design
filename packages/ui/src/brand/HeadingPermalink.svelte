<!--
  A heading's permalink: a "#" that shows when its heading is hovered or the link is focused.
  Its name is "{label}: {heading text}": aria-labelledby reads the label span, then the target. The
  span is `hidden`, so only the direct reference reads it, and the label never repeats when the link
  sits inside its target.
-->
<script lang="ts" module>
	export interface HeadingPermalinkProps {
		/** The id of the heading it links to. That element's text completes the accessible name. */
		target: string;
		/** The localized start of the accessible name, such as "Link to this section". */
		label: string;
	}
</script>

<script lang="ts">
	let { target, label }: HeadingPermalinkProps = $props();
	const uid = $props.id();
	const labelId = `${uid}-label`;
</script>

<a class="heading-anchor" data-slot="heading-permalink" href="#{target}" aria-labelledby="{labelId} {target}"
	><span aria-hidden="true">#</span><span id={labelId} hidden>{label}:</span></a
>

<style>
	/* The link hangs in the margin beside its heading. Zero specificity: any heading rule wins. */
	:global(:where(:is(h1, h2, h3, h4, h5, h6):has(> [data-slot='heading-permalink']))) {
		position: relative;
	}

	.heading-anchor {
		position: absolute;
		right: 100%;
		margin-right: 0.5rem;
		color: var(--primary);
		text-decoration: none;
		opacity: 0;
		transform: translateX(-4px);
		transition: opacity var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default);
	}

	:global(:is(h1, h2, h3, h4, h5, h6):hover) > .heading-anchor {
		opacity: var(--opacity-muted);
		transform: translateX(0);
	}

	/* The second selector outranks the hover rule, so a focused link stays at full strength. */
	.heading-anchor:focus-visible,
	:global(:is(h1, h2, h3, h4, h5, h6)) > .heading-anchor:focus-visible {
		opacity: 1;
		transform: translateX(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.heading-anchor {
			transform: none;
			transition-property: opacity;
		}
	}
</style>
