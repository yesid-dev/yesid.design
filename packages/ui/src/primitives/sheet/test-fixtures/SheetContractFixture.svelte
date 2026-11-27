<script lang="ts">
	import { Sheet, SheetBody, SheetContent, SheetDescription, SheetTitle, type SheetContentProps } from '../index.js';

	type Props = { modal?: boolean; side?: SheetContentProps['side'] } & (
		| { closeLabel: string; showCloseButton?: boolean }
		| { closeLabel?: string; showCloseButton: false });

	let props: Props = $props();
	let open = $state(true);
</script>

<Sheet bind:open>
	<SheetContent portalProps={{ disabled: true }} {...props}>
		<SheetTitle>Fixture title</SheetTitle>
		<SheetDescription>Fixture description</SheetDescription>
		<SheetBody id="fixture-body" class="py-2" lang="en">Fixture body</SheetBody>
	</SheetContent>
</Sheet>

