import {computed, derived, writable} from '@amadeus-it-group/tansu';
import type {WidgetsCommonPropsAndState} from './commonProps';
import {bindableDerived, createStoreDirective, writablesForProps} from './services';
import type {ConfigValidator, PropsConfig} from './services';
import {stateStores} from './services/stores';
import {typeArray, typeBoolean, typeFunction, typeNumber, typeNumberInRangeFactory} from './services/writables';
import type {Directive, Widget} from './types';
import {noop} from './utils';

export interface ProgressDisplayOptions {
	/**
	 * Left offset of the progress in %
	 */
	left: number;
	/**
	 * Bottom offset of the progresss in %
	 */
	bottom: number;
	/**
	 * Width of the progress in %
	 */
	width: number;
	/**
	 * Height of hte progress in %
	 */
	height: number;
}

export interface HandleDisplayOptions {
	/**
	 * Left offset of the handle in %
	 */
	left: number;
	/**
	 * Top offset of the handle in %
	 */
	top: number;
}

export interface SliderCommonPropsAndState extends WidgetsCommonPropsAndState {
	/**
	 * Minimum value that can be assigned to the slider
	 */
	min: number;

	/**
	 * Maximum value that can be assigned to the slider
	 */
	max: number;

	/**
	 * Unit value between slider steps
	 */
	stepSize: number;

	/**
	 * If `true` slider value cannot be changed but the slider is still focusable
	 */
	readonly: boolean;

	/**
	 * If `true` slider value cannot be changed and the slider cannot be focused
	 */
	disabled: boolean;

	/**
	 * If `true` is vertically positioned otherwise it is horizontal
	 */
	vertical: boolean;

	/**
	 * Current slider values
	 */
	values: number[];
}

export interface SliderState extends SliderCommonPropsAndState {
	/**
	 * Sorted slider values
	 */
	sortedValues: number[];

	/**
	 * Combined label left offset in %
	 */
	combinedLabelPositionLeft: number;

	/**
	 * Combined label top offset in %
	 */
	combinedLabelPositionTop: number;

	/**
	 * If true, the minimum label will be visible
	 */
	minValueLabelDisplay: boolean;

	/**
	 * If true, the maximum label will be visible
	 */
	maxValueLabelDisplay: boolean;

	/**
	 * If true, the label when the handles are close is visible
	 */
	combinedLabelDisplay: boolean;

	/**
	 * Array of the sorted handles to display
	 */
	sortedHandles: {value: number; id: number}[];

	/**
	 * Array of objects representing progress display options
	 */
	progressDisplayOptions: ProgressDisplayOptions[];

	/**
	 * Array of objects representing handle display options
	 */
	handleDisplayOptions: HandleDisplayOptions[];
}

export interface SliderProps extends SliderCommonPropsAndState {
	/**
	 * An event emitted when slider values are changed
	 *
	 * Event payload equals to the updated slider values
	 */
	onValuesChange: (values: number[]) => void;
}

export interface SliderApi {}

export interface SliderDirectives {
	/**
	 * Directive to get the slider component elementRef
	 */
	sliderDirective: Directive;

	/**
	 * Directive to get the minLabel elementRef
	 */
	minLabelDirective: Directive;

	/**
	 * Directive to get the maxLabel elementRef
	 */
	maxLabelDirective: Directive;
}

export interface SliderActions {
	/**
	 * Method to handle click on the slider
	 * @param event - mouse event
	 */
	click(event: MouseEvent): void;
	/**
	 * Method to process the keyboard event
	 * @param event - keyboard event object
	 * @param handleNumber - id of the modified handle
	 */
	keydown(event: KeyboardEvent, handleNumber: number): void;

	/**
	 * Method describing the behavior of the slider handle on mouse down event
	 * @param event - mouse event
	 * @param handleId - numeric id of the handle
	 */
	mouseDown(event: MouseEvent, handleId: number): void;
}

export type SliderWidget = Widget<SliderProps, SliderState, SliderApi, SliderActions, SliderDirectives>;

const defaultSliderConfig: SliderProps = {
	min: 0,
	max: 100,
	stepSize: 1,
	readonly: false,
	disabled: false,
	vertical: false,
	className: '',
	onValuesChange: noop,
	values: [0],
};

/**
 * Returns a shallow copy of the default slider config.
 * @returns a copy of the default config
 */
export function getSliderDefaultConfig() {
	return {...defaultSliderConfig};
}

const configValidator: ConfigValidator<SliderProps> = {
	min: typeNumber,
	max: typeNumber,
	stepSize: typeNumberInRangeFactory(0, +Infinity),
	readonly: typeBoolean,
	disabled: typeBoolean,
	vertical: typeBoolean,
	onValuesChange: typeFunction,
	values: typeArray,
};

/**
 * Create a slider widget with given config props
 * @param config - an optional slider config
 * @returns a SliderWidget
 */
export function createSlider(config?: PropsConfig<SliderProps>): SliderWidget {
	const [
		{
			// dirty inputs that need adjustment:
			min$: _dirtyMinimum$,
			max$: _dirtyMaximum$,
			stepSize$,
			values$: _dirtyValues$,

			onValuesChange$,

			...stateProps
		},
		patch,
	] = writablesForProps(defaultSliderConfig, config, configValidator);
	const {vertical$, disabled$, readonly$} = stateProps;
	let _prevCoordinate = -1;
	// clean inputs adjustment
	const min$ = computed(() => {
		if (_dirtyMinimum$() === _dirtyMaximum$()) return defaultSliderConfig.min;
		return Math.min(_dirtyMinimum$(), _dirtyMaximum$());
	});
	const max$ = computed(() => {
		if (_dirtyMinimum$() === _dirtyMaximum$()) return defaultSliderConfig.max;
		return Math.max(_dirtyMinimum$(), _dirtyMaximum$());
	});

	const values$ = bindableDerived(
		onValuesChange$,
		[_dirtyValues$],
		([dirtyValues]) => dirtyValues.map((dv) => computeCleanValue(dv)),
		(a, b) => a.every((val, index) => val === b[index])
	);

	// computed
	const {directive: sliderDirective, element$: sliderDom$} = createStoreDirective();
	const {directive: minLabelDirective, element$: minLabelDom$} = createStoreDirective();
	const {directive: maxLabelDirective, element$: maxLabelDom$} = createStoreDirective();

	const sliderResized$ = derived(
		sliderDom$,
		(sliderDom, set) => {
			if (!sliderDom) {
				set({});
				return;
			}
			const resizeObserver = new ResizeObserver(() => {
				set({});
			});
			resizeObserver.observe(sliderDom);
			return () => resizeObserver.disconnect();
		},
		{}
	);
	const updateSliderSize$ = writable({});
	const sliderDomRect$ = computed(
		() => {
			sliderResized$();
			updateSliderSize$();
			return sliderDom$()?.getBoundingClientRect() ?? ({} as DOMRect);
		},
		{
			equal: Object.is,
		}
	);
	const minLabelDomRect$ = computed(
		() => {
			sliderResized$();
			updateSliderSize$();
			return minLabelDom$()?.getBoundingClientRect() ?? ({} as DOMRect);
		},
		{
			equal: (a, b) => Object.is(a, b),
		}
	);
	const maxLabelDomRect$ = computed(
		() => {
			sliderResized$();
			updateSliderSize$();
			return maxLabelDom$()?.getBoundingClientRect() ?? ({} as DOMRect);
		},
		{
			equal: (a, b) => Object.is(a, b),
		}
	);

	const sliderDomRectOffset$ = computed(() => (vertical$() ? sliderDomRect$().top : sliderDomRect$().left));
	const sliderDomRectSize$ = computed(() => (vertical$() ? sliderDomRect$().height : sliderDomRect$().width));
	const sortedValues$ = computed(() => [...values$()].sort((a, b) => a - b));
	const sortedHandles$ = computed(() =>
		values$()
			.map((val, index) => {
				return {id: index, value: val};
			})
			.sort((a, b) => a.value - b.value)
	);
	const valuesPercent$ = computed(() => values$().map((val) => percentCompute(val)));
	const sortedValuesPercent$ = computed(() => [...valuesPercent$()].sort((a, b) => a - b));
	const minLabelWidth$ = computed(() => (minLabelDomRect$().width / sliderDomRectSize$()) * 100);
	const maxLabelWidth$ = computed(() => (maxLabelDomRect$().width / sliderDomRectSize$()) * 100);
	const minValueLabelDisplay$ = computed(() => {
		const minLabelWidth = minLabelWidth$();
		return !valuesPercent$().some((percent) => percent < minLabelWidth + 1);
	});
	const maxValueLabelDisplay$ = computed(() => {
		const maxLabelWidth = maxLabelWidth$();
		return !valuesPercent$().some((percent) => percent > 100 - maxLabelWidth - 1);
	});
	// TODO define the intersection value
	const combinedLabelDisplay$ = computed(() => {
		const values = values$();
		return values.length == 2 && Math.abs(values[0] - values[1]) < 10;
	});
	const isInteractable$ = computed(() => !disabled$() && !readonly$());

	const combinedLabelPositionLeft$ = computed(() =>
		vertical$() || sortedValuesPercent$().length != 2 ? 0 : (sortedValuesPercent$()[0] + sortedValuesPercent$()[1]) / 2
	);
	const combinedLabelPositionTop$ = computed(() =>
		vertical$() && sortedValuesPercent$().length == 2 ? 100 - (sortedValuesPercent$()[0] + sortedValuesPercent$()[1]) / 2 : 0
	);

	// const handleTooltipLeft$ = computed(() => (vertical$() ? Array(valuesPercent$().length).fill(0) : valuesPercent$()));
	// const handleTooltipTop$ = computed(() => (vertical$() ? valuesPercent$().map((vp) => 100 - vp) : Array(valuesPercent$().length).fill(0)));

	const handleDisplayOptions$ = computed(() =>
		valuesPercent$().map((vp) => {
			return {
				left: vertical$() ? 0 : vp,
				top: vertical$() ? 100 - vp : 0,
			};
		})
	);

	const progressDisplayOptions$ = computed(() => {
		if (sortedValuesPercent$().length === 1) {
			return [
				{
					left: 0,
					bottom: 0,
					width: vertical$() ? 100 : sortedValuesPercent$()[0],
					height: vertical$() ? sortedValuesPercent$()[0] : 100,
				},
			];
		} else {
			return sortedValuesPercent$()
				.map((svp, index, array) => {
					return {
						left: vertical$() ? 0 : svp,
						bottom: vertical$() ? svp : 0,
						width: vertical$() ? 100 : index === array.length - 1 ? svp : array[index + 1] - svp,
						height: vertical$() ? (index === array.length - 1 ? svp : array[index + 1] - svp) : 100,
					};
				})
				.slice(0, sortedValuesPercent$().length - 1);
		}
	});

	// functions
	const computeCleanValue = (value: number) => {
		if (value >= max$()) {
			return max$();
		} else if (value <= min$()) {
			return min$();
		}
		const indexMin = Math.floor(value / stepSize$());
		return value % stepSize$() < stepSize$() / 2 ? indexMin * stepSize$() : (indexMin + 1) * stepSize$();
	};
	const percentCompute = (value: number) => {
		return ((value - min$()) * 100) / (max$() - min$());
	};
	const getClosestSliderHandle = (clickedPercent: number) => {
		if (values$().length === 1) {
			return 0;
		}
		const closestBigger = sortedValues$().find((sv) => sv > clickedPercent * 100);
		const closestBiggerIndex = closestBigger ? sortedValues$().indexOf(closestBigger!) : sortedValues$().length - 1;
		const midPoint = sortedValues$()[closestBiggerIndex - 1] + (sortedValues$()[closestBiggerIndex] - sortedValues$()[closestBiggerIndex - 1]) / 2;
		let closestValue: number;
		if (clickedPercent * 100 <= midPoint) {
			closestValue = sortedValues$()[closestBiggerIndex - 1];
		} else {
			closestValue = sortedValues$()[closestBiggerIndex];
		}
		return values$().indexOf(closestValue);
	};

	const adjustCoordinate = (clickedCoordinate: number, handleNumber?: number) => {
		if (isInteractable$()) {
			const clickedPercent = vertical$()
				? (sliderDomRectSize$() - clickedCoordinate + sliderDomRectOffset$()) / sliderDomRectSize$()
				: (clickedCoordinate - sliderDomRectOffset$()) / sliderDomRectSize$();
			const derivedHandleIndex = handleNumber ?? getClosestSliderHandle(clickedPercent);
			const newValue = clickedPercent * (max$() - min$()) + min$();
			_dirtyValues$.update((dh) => {
				dh = [...dh];
				dh[derivedHandleIndex] = newValue;
				return dh;
			});
		}
	};

	return {
		...stateStores({
			min$,
			max$,
			stepSize$,
			values$,
			sortedValues$,
			sortedHandles$,
			minValueLabelDisplay$,
			maxValueLabelDisplay$,
			combinedLabelDisplay$,
			isInteractable$,
			combinedLabelPositionLeft$,
			combinedLabelPositionTop$,
			progressDisplayOptions$,
			handleDisplayOptions$,
			...stateProps,
		}),
		patch,
		api: {},
		directives: {
			sliderDirective,
			minLabelDirective,
			maxLabelDirective,
		},
		actions: {
			click(event: MouseEvent) {
				updateSliderSize$.set({});
				adjustCoordinate(vertical$() ? event.clientY : event.clientX);
			},
			keydown(event: KeyboardEvent, handleIndex: number) {
				const {key} = event;
				if (isInteractable$()) {
					switch (key) {
						case 'ArrowDown':
						case 'ArrowLeft':
							_dirtyValues$.update((value) => {
								value = [...value];
								value[handleIndex] = values$()[handleIndex] - stepSize$();
								return value;
							});
							break;
						case 'ArrowUp':
						case 'ArrowRight':
							_dirtyValues$.update((value) => {
								value = [...value];
								value[handleIndex] = values$()[handleIndex] + stepSize$();
								return value;
							});
							break;
						case 'Home':
							_dirtyValues$.update((value) => {
								value = [...value];
								value[handleIndex] = min$();
								return value;
							});
							break;
						case 'End':
							_dirtyValues$.update((value) => {
								value = [...value];
								value[handleIndex] = max$();
								return value;
							});
							break;
						case 'PageUp':
							// TODO it is optional in accessibility guidelines, so define the skip value for steps and write unit test
							break;
						case 'PageDown':
							// TODO it is optional in accessibility guidelines, so define the skip value for steps and write unit test
							break;
						default:
							return;
					}
					event.preventDefault();
					event.stopPropagation();
				}
			},
			mouseDown(event: MouseEvent, handleId: number) {
				event.preventDefault();
				const handleDrag = (e: MouseEvent) => {
					e.preventDefault();
					const newCoord = vertical$() ? e.clientY : e.clientX;
					(event.target as HTMLElement).focus();
					if (_prevCoordinate !== newCoord) {
						_prevCoordinate = newCoord;
						adjustCoordinate(newCoord, handleId);
					}
				};
				if (isInteractable$()) {
					(event.target as HTMLElement).focus();
					document.addEventListener('mousemove', handleDrag);
					// TODO mouse up doesn't work outside the handle area
					document.addEventListener(
						'mouseup',
						() => {
							document.removeEventListener('mousemove', handleDrag);
						},
						{once: true}
					);
				}
			},
		},
	};
}
