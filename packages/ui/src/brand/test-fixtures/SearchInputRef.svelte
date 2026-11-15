<script lang="ts">
import SearchInput from '../SearchInput.svelte';
let ref = $state<HTMLInputElement | null>(null);
</script>
<button onclick={() => ref?.focus()}>Focus search</button>
<SearchInput label="Routes" placeholder="Name" bind:ref />
