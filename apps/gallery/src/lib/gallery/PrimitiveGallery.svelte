<script lang="ts">
	import { Badge } from '@yesid/ui/badge';
	import { Button } from '@yesid/ui/button';
	import * as Card from '#lib/card/index.js';
	import * as Collapsible from '@yesid/ui/collapsible';
	import { Combobox, type ComboboxOption } from '@yesid/ui/combobox';
	import { FooterGroup, FooterLink } from '@yesid/ui/footer';
	import {
		ResizableHandle,
		ResizablePane,
		ResizablePaneGroup,
	} from '@yesid/ui/resizable';
	import { ScrollArea } from '@yesid/ui/scroll-area';
	import { Separator } from '@yesid/ui/separator';
	import * as Sheet from '@yesid/ui/sheet';
	import { Skeleton } from '@yesid/ui/skeleton';
	import { Switch } from '@yesid/ui/switch';
	import * as Tabs from '@yesid/ui/tabs';
	import { Tooltip } from '@yesid/ui/tooltip';

	let collapsibleOpen = $state(true);
	let liveUpdatesPaused = $state(false);
	let comboboxValue = $state<string | null>('operations');
	let rankMeasure = $state<string | null>('response-time');
	let reportPeriod = $state<string | null>(null);
	let reportPeriodChanges = $state(0);
	let footerStatusRefreshes = $state(0);
	let sheetOpen = $state(false);
	let detentOpen = $state(false);
	let outsideCount = $state(0);
	let headerCount = $state(0);
	let detent = $state('half');
	const sheetDetents = [
		{ id: 'peek', size: '120px', label: 'Peek' },
		{ id: 'half', size: '50%', label: 'Half height' },
		{ id: 'full', size: '90%', label: 'Full height' },
	] as const;

	const comboboxOptions: readonly ComboboxOption[] = [
		{
			value: 'operations',
			label: 'Operations overview',
			sublabel: 'Current service indicators',
			glyph: '01',
			search: 'operations overview current service indicators',
		},
		{
			value: 'accessibility',
			label: 'Accessibilité universelle',
			sublabel: 'Parcours, ascenseurs et correspondances',
			glyph: '02',
			search: 'accessibilite universelle parcours ascenseurs correspondances',
		},
		{
			value: 'continuity',
			label: 'Continuidad del servicio durante interrupciones planificadas',
			sublabel: 'Información operativa multilingüe',
			glyph: '03',
			search: 'continuidad servicio interrupciones planificadas informacion operativa multilingue',
		},
	];

	const rankOptions: readonly ComboboxOption[] = [
		{ value: 'response-time', label: 'Response time', search: 'response time latency' },
		{ value: 'error-rate', label: 'Error rate', search: 'error rate failures' },
		{ value: 'request-volume', label: 'Request volume', search: 'request volume traffic' },
	];
	const periodOptions = [
		{ value: 'today', label: 'Today' },
		{ value: 'last-week', label: 'Previous seven complete reporting days', sublabel: 'Excludes the current reporting day' },
		{ value: 'last-month', label: 'Previous calendar month' },
	];

	function foldText(raw: string): string {
		return raw
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim();
	}

	function refreshFooterStatus() {
		footerStatusRefreshes += 1;
	}
</script>

<section class="mt-10" aria-labelledby="gallery-primitives">
	<h2 id="gallery-primitives" class="font-heading text-title font-semibold">UI primitives</h2>
	<p class="mt-1 text-reading-support leading-[1.7] text-muted-foreground">
		Every public family rendered through its package subpath, including neutral operational
		states.
	</p>

	<div class="mt-4 grid gap-4 lg:grid-cols-2">
		<Card.Root data-gallery-family="primitive:card" interactive>
			<Card.Header>
				<Card.Title>Controls and status</Card.Title>
				<Card.Description>Element semantics, state, and caller-owned copy.</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-4">
				<div class="flex flex-wrap items-center gap-3" data-gallery-state="disabled">
					<div data-gallery-family="primitive:button">
						<Button variant="conversion" size="cta-sm">Run check</Button>
						<Button class="ml-2" size="icon-tap" aria-label="Add check">+</Button>
						<Button class="ml-2" variant="outline" disabled>Unavailable</Button>
					</div>
					<div data-gallery-family="primitive:badge">
						<Badge class="text-operational-label" variant="tag">Configured vocabulary</Badge>
						<Badge class="ml-2" variant="destructive">Attention</Badge>
					</div>
				</div>

				<div
					data-gallery-state="error"
					role="alert"
					class="rounded-md border border-destructive bg-destructive/10 p-3"
				>
					<p class="font-heading text-small font-semibold text-destructive">Update not applied</p>
					<p class="mt-1 text-caption text-muted-foreground">
						The submitted revision conflicts with a newer version. Reload before retrying.
					</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:footer">
			<Card.Header>
				<Card.Title>Footer leaves</Card.Title>
				<Card.Description>
					The caller owns the landmark, destinations, labels, and button behavior.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<FooterGroup label="Gallery resources">
					<nav aria-label="Gallery footer examples" class="flex flex-col items-start">
						<FooterLink href="#gallery-primitives">Primitive index</FooterLink>
						<FooterLink onclick={refreshFooterStatus}>
							Refresh status
						</FooterLink>
					</nav>
					<p role="status" class="font-mono text-caption text-muted-foreground">
						Status refreshes: {footerStatusRefreshes}
					</p>
				</FooterGroup>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Tabs</Card.Title>
				<Card.Description>Horizontal navigation with an explicit disabled destination.</Card.Description>
			</Card.Header>
			<Card.Content data-gallery-family="primitive:tabs">
				<Tabs.Root value="summary">
					<Tabs.List variant="line">
						<Tabs.Trigger value="summary">Summary</Tabs.Trigger>
						<Tabs.Trigger value="details">Details</Tabs.Trigger>
						<Tabs.Trigger value="archive" disabled>Archive</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="summary" class="pt-4">Stable package defaults.</Tabs.Content>
					<Tabs.Content value="details" class="pt-4">Caller classes still compose.</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-2" data-gallery-family="primitive:combobox">
			<Card.Header>
				<Card.Title>Combobox</Card.Title>
				<Card.Description>
					Search a catalogue, keep a searchable choice, or pick from a fixed list.
				</Card.Description>
			</Card.Header>
			<Card.Content class="gallery-combobox-demo grid gap-3">
				<div data-gallery-state="localized-copy" lang="fr">
					<Combobox
						options={comboboxOptions}
						bind:value={comboboxValue}
						label="Choisir une vue opérationnelle"
						placeholder="Saisir un nom de vue"
						clearLabel="Effacer la vue sélectionnée"
						emptyLabel="Aucune vue correspondante"
						fold={foldText}
					/>
				</div>
				<p class="font-mono text-caption text-muted-foreground">
					Selected: {comboboxValue ?? 'none'}
				</p>
				<div data-gallery-demo="combobox-required-choice">
					<Combobox
						options={rankOptions}
						bind:value={rankMeasure}
						clearable={false}
						label="Rank by measure"
						placeholder="Type a measure"
						emptyLabel="No matching measure"
						fold={foldText}
					/>
				</div>
				<p class="font-mono text-caption text-muted-foreground">
					Ranked by: {rankMeasure ?? 'none'}
				</p>
				<form data-gallery-demo="combobox-select-only" data-value={reportPeriod}
					data-value-changes={reportPeriodChanges} class="grid gap-2" onsubmit={(event) => event.preventDefault()}>
					<Combobox searchable={false} options={periodOptions} bind:value={reportPeriod}
						label="Reporting period" placeholder="Choose a period" required name="period"
						onValueChange={() => reportPeriodChanges++} />
					<Button type="submit" variant="outline" size="cta-sm" class="justify-self-start">Apply period</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:collapsible">
			<Card.Header>
				<Card.Title>Collapsible</Card.Title>
				<Card.Description>Disclosure state with package-owned reduced-motion behavior.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Collapsible.Root bind:open={collapsibleOpen}>
					<Collapsible.Trigger
						class="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left"
					>
						<span>Maintenance window</span>
						<span aria-hidden="true">{collapsibleOpen ? '−' : '+'}</span>
					</Collapsible.Trigger>
					<Collapsible.Content class="pt-3 text-small text-muted-foreground">
						A neutral disclosure owns no persistence, route, or product policy.
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:resizable">
			<Card.Header>
				<Card.Title>Resizable</Card.Title>
				<Card.Description>Keyboard- and pointer-adjustable horizontal panes.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="h-32 overflow-hidden rounded-md border border-border">
					<ResizablePaneGroup direction="horizontal">
						<ResizablePane defaultSize={55} minSize={30}>
							<div class="flex h-full items-center justify-center bg-muted p-3">Overview</div>
						</ResizablePane>
						<ResizableHandle withHandle />
						<ResizablePane defaultSize={45} minSize={25}>
							<div class="flex h-full items-center justify-center bg-card p-3">Detail</div>
						</ResizablePane>
					</ResizablePaneGroup>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:scroll-area">
			<Card.Header>
				<Card.Title>ScrollArea</Card.Title>
				<Card.Description>Bounded content with deliberately overflowing copy.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div data-gallery-state="overflow" aria-label="Scrollable operational notes">
					<ScrollArea class="h-36 rounded-md border border-border" orientation="vertical">
						<ul class="space-y-3 p-3 text-small">
							{#each comboboxOptions as option (option.value)}
								<li>
									<p class="font-medium">{option.label}</p>
									<p class="text-caption text-muted-foreground">{option.sublabel}</p>
								</li>
							{/each}
							<li>
								<p class="font-medium">Extended operational context</p>
								<p class="text-caption text-muted-foreground">
									This final entry ensures the viewport overflows without relying on a product fixture.
								</p>
							</li>
						</ul>
					</ScrollArea>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:separator">
			<Card.Header>
				<Card.Title>Separator</Card.Title>
				<Card.Description>Default, gradient, hazard and dimension treatments.</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-3">
				<Separator />
				<Separator variant="gradient" label="PROCESS BOUNDARY" />
				<Separator variant="hazard" hazardSize="sm" />
				<Separator variant="dimension" />
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:sheet">
			<Card.Header>
				<Card.Title>Sheet</Card.Title>
				<Card.Description>Localized dialog copy with focus-managed dismissal.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Sheet.Root bind:open={sheetOpen}>
					<Sheet.Trigger
						class="rounded-md border border-border px-3 py-2 text-small hover:border-primary"
					>
						Open details
					</Sheet.Trigger>
					<Sheet.Content side="right" closeLabel="Fermer le panneau">
						<Sheet.Header class="border-b border-border p-4">
							<Sheet.Title>Operational detail</Sheet.Title>
							<Sheet.Description>
								A generic drawer demonstrates focus, dismissal, and long copy.
							</Sheet.Description>
						</Sheet.Header>
						<div class="overflow-y-auto p-4 text-small">
							Content remains readable when translated text expands beyond its source length.
						</div>
						<Sheet.Footer class="mt-auto border-t border-border p-4">
							<Sheet.Close class="min-h-11 rounded-md border border-border px-3 py-2">Done</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
				<Sheet.Root>
					<Sheet.Trigger class="min-h-11 rounded-md border border-border px-3 py-2 text-small hover:border-primary">
						Open schedule note
					</Sheet.Trigger>
					<Sheet.Content showCloseButton={false}>
						<Sheet.Header>
							<Sheet.Title>Schedule note</Sheet.Title>
							<Sheet.Description>Check the current operating hours.</Sheet.Description>
						</Sheet.Header>
						<Sheet.Body>Weekend hours are in effect.</Sheet.Body>
						<Sheet.Footer>
							<Sheet.Close class="min-h-11 rounded-md border border-border px-3 py-2">Done</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header><Card.Title>Sheet detents</Card.Title></Card.Header>
			<Card.Content>
				<button class="min-h-11 border border-border px-3" onclick={() => outsideCount++}>Outside count: {outsideCount}</button>
				<Sheet.Root bind:open={detentOpen}>
					<Sheet.Trigger class="min-h-11 border border-border px-3">Open draggable sheet</Sheet.Trigger>
					<Sheet.Content modal={false} detents={sheetDetents} bind:detent handleLabel="Sheet height" closeLabel="Close draggable sheet">
						<Sheet.Header class="shrink-0 gap-0 px-4 py-0">
							<Sheet.Title>Draggable detail</Sheet.Title>
							<button class="min-h-11 self-start" onclick={() => headerCount++}>Header action: {headerCount}</button>
						</Sheet.Header>
						<div data-testid="sheet-scroll-body" class="min-h-0 flex-1 overflow-y-auto p-4">
							<Sheet.Description>Resize with the handle or header. The page stays interactive.</Sheet.Description>
							{#each Array.from({ length: 60 }, (_, i) => i) as row (row)}<p class="py-3">Operational note {row + 1}</p>{/each}
						</div>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:tooltip">
			<Card.Header><Card.Title>Tooltip</Card.Title></Card.Header>
			<Card.Content class="flex flex-wrap justify-end gap-2">
				<Tooltip content="Check for active disruptions and delays.">
					{#snippet trigger({ props })}
						<Button {...props} variant="outline" size="cta-sm">Service alerts</Button>
					{/snippet}
				</Tooltip>
				<Tooltip content="Read how planned service changes affect connections and accessible boarding.">
					{#snippet trigger({ props })}
						<a {...props} type={undefined} href="/app-frame" class="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-small hover:border-primary">Service guide</a>
					{/snippet}
				</Tooltip>
				<Tooltip content="Use the name displayed in the service directory when adding an entry. Include the region if several entries share the same name. The directory uses this text to match service alerts to the correct entry.">
					{#snippet trigger({ props })}
						<input {...props} type="text" aria-label="Service name" placeholder="Service name"
							class="min-h-11 min-w-0 max-w-full rounded-md border border-border bg-card px-3 py-2 text-small" />
					{/snippet}
				</Tooltip>
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:switch">
			<Card.Header>
				<Card.Title>Switch</Card.Title>
				<Card.Description>An on/off setting that states its state in words, not colour alone.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Switch label="Pause live updates" stateLabels={{ on: 'Paused', off: 'Live' }} bind:checked={liveUpdatesPaused} />
			</Card.Content>
		</Card.Root>

		<Card.Root data-gallery-family="primitive:skeleton">
			<Card.Header>
				<Card.Title>Loading and error idioms</Card.Title>
				<Card.Description>Accessible state belongs to the composition, not the decoration.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div
					data-gallery-state="loading"
					role="status"
					aria-busy="true"
					aria-label="Loading operational summary"
					class="grid gap-2"
				>
					<Skeleton class="h-4 w-2/3" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-5/6" />
				</div>
			</Card.Content>
		</Card.Root>

	</div>
</section>
