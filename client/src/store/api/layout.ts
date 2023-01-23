import produce from "immer";
import { useCallback, useMemo, useState } from "react";
import { Layout } from "react-grid-layout";
import { Widget } from "store/type";
import { SessionApi } from "./session";
import { WidgetApi } from "./widget";

export const Grid = 32;

const adjustHeight = (layout: Layout) => {
	// Make sure the top of always visible
	if (layout.y < 0) {
		layout.y = 0;
	}
	// Make sure the bottom is always visible
	if (layout.y >= Grid) {
		layout.y = Grid;
	}
	if (layout.y + layout.h > Grid) {
		layout.h = Grid - layout.y;
	}
	// Make sure the left is always visible
	if (layout.x < 0) {
		layout.x = 0;
	}
	if (layout.x >= Grid) {
		layout.x = Grid;
	}
	// Make sure the right is always visible
	if (layout.x + layout.w > Grid) {
		layout.w = Grid - layout.x;
	}
	// If the widget has 0 width or height, try to make it visible
	if (layout.w <= 0) {
		layout.w = Grid - layout.x;
	}
	// If the widget has 0 width or height, try to make it visible
	if (layout.h <= 0) {
		layout.h = Grid - layout.h;
	}
	return layout;
};

export const useLayoutApi = ({
	widgets,
	setWidgets
}: WidgetApi, {
	log
}: SessionApi) => {
	const [isEditingLayout, setEditingLayout] = useState<boolean>(false);
	const layouts = useMemo(()=>{
		return widgets.map((widget, i)=>{
			return {
				i: i.toString(),
				...widget.layout,
			};
		});
	}, [widgets]);

	const setLayouts = useCallback((layouts: Layout[]) => {
		const adjusted = layouts.map(adjustHeight);
		setWidgets(produce(widgets, draft=>{
			adjusted.forEach(({i,x,y,w,h})=>{
				const idx = parseInt(i);
				if (widgets[idx] === undefined){
					log("E", "client", `Error: Invalid Widget key "${i}" when adjusting layout`);
					return;
				}
				draft[idx].layout = {x,y,w,h};

			});
		}));
	}, [widgets]);

	return useMemo(()=>({
		isEditingLayout,
		setEditingLayout,
		layouts,
		setLayouts
	}), [
		isEditingLayout,
		setEditingLayout,
		layouts,
		setLayouts
	]);

};

export type LayoutApi = Readonly<ReturnType<typeof useLayoutApi>>;