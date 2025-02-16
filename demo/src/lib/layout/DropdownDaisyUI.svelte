<script lang="ts" generics="Item extends import('./dropdown').DropdownItem">
	import {createHasFocus} from '@agnos-ui/svelte-bootstrap/services/focustrack';
	import {fromStore} from 'svelte/store';
	import type {Snippet} from 'svelte';

	let open = $state(false);

	const {hasFocus$, directive} = createHasFocus();
	const focus = fromStore(hasFocus$);
	$effect(() => {
		open = focus.current;
	});

	function giveFocus(el: HTMLAnchorElement | HTMLButtonElement, index: number) {
		if (index === 0) {
			// is possible in ssr because always closed first
			el.focus();
		}
	}

	const toggle = (event: (MouseEvent & {currentTarget: EventTarget & HTMLElement}) | undefined) => {
		open = !open;
		event?.preventDefault();
	};

	interface Props {
		ariaLabel: string;
		btnClass: string;
		items: Item[];
		placement?: 'start' | 'end';
		dropdownClass?: string;
		buttonSnip: Snippet;
		itemSnip: Snippet<[Item, number]>;
	}

	let {ariaLabel, btnClass = '', items, placement = 'start', dropdownClass = '', buttonSnip, itemSnip}: Props = $props();

	const onpointerDown = (event: PointerEvent) => {
		event.preventDefault();
		(event.target as HTMLElement).focus();
	};
	const onmousedown = (event: MouseEvent) => {
		event.preventDefault();
	};
</script>

<details class="dropdown {dropdownClass} dropdown-{placement}" {open}>
	<summary {onmousedown} onclick={(e) => toggle(e)} class="btn m-1 dropdown-toggle {btnClass}">{@render buttonSnip()}</summary>
	<div use:directive class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
		{#if open}
			{#each items as item, index (item.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<svelte:element
					this={item.tag}
					use:giveFocus={index}
					class={['flex items-center', {'btn-active': item.isSelected}, item.tag === 'button' ? 'btn btn-ghost' : '']}
					href={item.tag === 'a' ? item.href : undefined}
					aria-current={item.isSelected ? 'page' : false}
					onpointerdown={onpointerDown}
					onclick={(e: (MouseEvent & {currentTarget: EventTarget & HTMLElement}) | undefined) => {
						if (item.tag === 'button') {
							item.onclick();
						}
						toggle(e);
					}}
				>
					{@render itemSnip(item, index)}
				</svelte:element>
			{/each}
		{/if}
	</div>
</details>

<style>
	.dropdown {
		button ~ button {
			margin-top: 0.5rem;
		}
	}
</style>
