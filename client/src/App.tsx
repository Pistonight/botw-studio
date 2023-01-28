import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import ReactJson from "react-json-view";
import "./App.css";
import "data/opensource/ContextMenu/ContextMenu.css";

import { useGlobal } from "store/AppGlobal";
import { Grid } from "store/api";
import { WidgetViewer } from "ui/Widget";

//const MyGridLayout = WidthProvider(GridLayout);

function App() {



	const [mainHeight, setMainHeight] = useState<number>(window.innerHeight-1);
	const [mainWidth, setMainWidth] = useState<number>(window.innerWidth-1);

	useEffect(()=>{
		window.addEventListener("resize", ()=>{
			const div = document.getElementById("main");
			if(div){
				const height = div.getBoundingClientRect().height;
				const width = div.getBoundingClientRect().width;
				setMainHeight(height-1);
				setMainWidth(width-1);
			}
		});
	}, []);

	

	const {
		layouts,
		isEditingLayout,
		setLayouts,
		widgets,
		menu,
		openMenu,
		prompt
	} = useGlobal();

		

	const margin = isEditingLayout ? 5 : 1;

		//h * g + (m * (g+1)) = height
	return (
		<div className="root" onContextMenu={(e)=>openMenu(undefined, e)}>

			<div id="main" className="main" >
				<div style={{height: "100%"}}>
					<GridLayout
						className="layout"
						layout={layouts}
						cols={Grid}
						width={mainWidth}
			
						rowHeight={(mainHeight - (Grid+1)*margin)/Grid}
						isResizable={isEditingLayout}
						isDraggable={isEditingLayout}
						margin={[margin,margin]}
						onLayoutChange={(layouts) => setLayouts(layouts)}

					>
						{
							widgets.map((_, i)=>
								<div className="widget" key={i.toString()}>
									<WidgetViewer widgetId={i}  />
								</div>

							)
						}
					</GridLayout>
				</div>

			</div>
			{menu}
			{prompt}
		</div>
	);
}

export default App;
