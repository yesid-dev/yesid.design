<script lang="ts">
	import { Separator } from '../index.js';

	let dimensionRef = $state<HTMLDivElement | null>(null);
</script>

<Separator bind:ref={dimensionRef} variant="dimension" class="custom-rule" data-testid="dimension" />
<Separator variant="dimension" data-slot="custom-dimension" data-testid="dimension-slot" />

<output data-testid="dimension-ref">{dimensionRef?.tagName ?? ''}</output>
