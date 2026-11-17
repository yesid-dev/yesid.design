<script lang="ts">
	import { ListingRail } from '@yesid/ui/layout';
</script>

<svelte:head><title>Listing rail</title></svelte:head>
<section class="page-grid" aria-labelledby="contact-title">
	<ListingRail heading="Contact" titleId="contact-title" clipAtHeader={false} />
	<div class="content"><p>A standalone semantic page rail.</p><a href="#after">Continue</a></div>
</section>
<div id="after">After the section</div>

<style>
	.page-grid { min-height: 180vh; }
	.content { min-width: 0; padding: 2rem; }
	.content a { display: inline-flex; align-items: center; min-block-size: var(--size-tap-min, 44px); min-inline-size: var(--size-tap-min, 44px); }
	#after { min-height: 100vh; }
	@media (min-width: 1024px) {
		.page-grid { display: grid; grid-template-columns: auto 2px minmax(0, 1fr); }
	}
</style>
