import produce from "immer";
import { useCallback, useMemo, useState } from "react"
import { Layout } from "react-grid-layout";
import { Widget } from "store/type";
import { SessionApi } from "./session";
import { WidgetApi } from "./widget";

export const Grid = 32;

const adjustHeight = (layout: Layout) => {
    if (layout.y + layout.h > Grid) {
      layout.h = Grid - layout.y;
    }
    return layout;
  }

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

    return {
        isEditingLayout,
        setEditingLayout,
        layouts,
        setLayouts
    }

}