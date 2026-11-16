<script lang="ts">
	import { Separator } from '../index.js';

	let handDrawnRef = $state<HTMLDivElement | null>(null);
</script>

<Separator bind:ref={handDrawnRef} variant="hand-drawn" class="custom-stroke" data-testid="hand-drawn" />
<Separator variant="hand-drawn" data-slot="custom-hand-drawn" data-testid="hand-drawn-slot" />
<Separator variant="hand-drawn" data-testid="hand-drawn-attrs" data-extra="kept" />

<output data-testid="hand-drawn-ref">{handDrawnRef?.tagName ?? ''}</output>
