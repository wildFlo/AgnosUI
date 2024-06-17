import type {WidgetPropsSlots, WidgetFactory} from '@agnos-ui/svelte-headless/types';
import {
	createPagination as coreCreatePagination,
	getPaginationDefaultConfig as coreGetPaginationDefaultConfig,
} from '@agnos-ui/core-bootstrap/components/pagination';
import type {PaginationProps, PaginationWidget} from './pagination.gen';

export type * from './pagination.gen';
export const createPagination: WidgetFactory<PaginationWidget> = coreCreatePagination as any;
export const getPaginationDefaultConfig: () => PaginationProps = coreGetPaginationDefaultConfig as any;

export interface PaginationSlots extends WidgetPropsSlots<PaginationProps> {}
