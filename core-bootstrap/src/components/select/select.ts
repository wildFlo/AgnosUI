import type {
	ItemContext,
	SelectActions,
	SelectApi,
	SelectDirectives,
	SelectProps as CoreProps,
	SelectState as CoreState,
} from '@agnos-ui/core/components/select';
import {createSelect as createCoreSelect, getSelectDefaultConfig as getCoreDefaultConfig} from '@agnos-ui/core/components/select';
import {type ExtendWidgetAdaptSlotWidgetProps, extendWidgetProps} from '@agnos-ui/core/services/extendWidget';
import type {PropsConfig, SlotContent, Widget, WidgetSlotContext} from '@agnos-ui/core/types';

export * from '@agnos-ui/core/components/select';

/**
 * A type for the slot context of the pagination widget
 */
export type SelectContext<Item> = WidgetSlotContext<SelectWidget<Item>>;

export interface SelectItemContext<Item> extends SelectContext<Item> {
	/**
	 * Contextual data related to an item
	 */
	itemContext: ItemContext<Item>;
}

interface SelectExtraProps<Item> {
	/**
	 * The template to override the way each badge on the left of the input is displayed.
	 * This define the content of the badge inside the badge container.
	 */
	slotBadgeLabel: SlotContent<SelectItemContext<Item>>;

	/**
	 * The template to override the way each item is displayed in the list.
	 * This define the content of the badge inside the badge container.
	 */
	slotItem: SlotContent<SelectItemContext<Item>>;
}

export interface SelectState<Item> extends ExtendWidgetAdaptSlotWidgetProps<CoreState<Item>, SelectExtraProps<Item>, object> {}
export interface SelectProps<Item> extends ExtendWidgetAdaptSlotWidgetProps<CoreProps<Item>, SelectExtraProps<Item>, object> {}

export type SelectWidget<Item> = Widget<SelectProps<Item>, SelectState<Item>, SelectApi<Item>, SelectActions<Item>, SelectDirectives<Item>>;

const defaultConfigExtraProps: SelectExtraProps<any> = {
	slotBadgeLabel: ({itemContext}: SelectItemContext<any>) => itemContext.item,
	slotItem: ({itemContext}: SelectItemContext<any>) => itemContext.item,
};

/**
 * Retrieve a shallow copy of the default Select config
 * @returns the default Select config
 */
export function getSelectDefaultConfig(): SelectProps<any> {
	return {...getCoreDefaultConfig(), ...defaultConfigExtraProps} as any;
}

/**
 * Creates a new select widget instance.
 * @param config - config of the modal, either as a store or as an object containing values or stores.
 * @returns a new select widget instance
 */
export const createSelect: <Item>(config?: PropsConfig<SelectProps<Item>>) => SelectWidget<Item> = extendWidgetProps(
	createCoreSelect,
	defaultConfigExtraProps,
	{},
) as any;
