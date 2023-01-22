import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import useContextMenu from "contextmenu";
import ReactJson from 'react-json-view';
import './App.css';
import 'contextmenu/ContextMenu.css';
//import { StringLogger } from './data/log';
import { MenuItem } from './MenuItem';
import {Base16Theme, createStyling} from "react-base16-styling";
import { ThreeCircles } from "react-loader-spinner";
import { Loading } from 'ui/Loading';
import { useGlobal } from 'store/AppGlobal';
import { Grid } from 'store/api';
import { WidgetViewer } from 'ui/Widget';


//const MyGridLayout = WidthProvider(GridLayout);

function App() {

	useEffect(()=>{
		const ws = new WebSocket("ws://localhost:8001");
		ws.onmessage = (e) => {
			//logger.log("I", "server", e.data);
		}
		window["DebugWebSocket" as any] = ws as any;
	}, []);

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
		})
	}, []);

	const [contextmenu, openContextMenu] = useContextMenu();

	const {
		layouts,
		isEditingLayout,
		setEditingLayout,
		setLayouts,
		widgets
	} = useGlobal();

	const menuConfig = {
		"Refresh": () => console.log(),
		"Deactivate": () => console.log(),
		"widget section": <hr style={{marginTop: 3, marginBottom: 3}}/>,
		"Change Session": {
		  "configuration": <MenuItem action={()=>{}} checked={true}>Connection</MenuItem>,
		  "console 1": <MenuItem action={()=>{}} checked={false}>Console</MenuItem>,
		  "separator": <hr style={{marginTop: 3, marginBottom: 3}}/>,
		  "shrine_elevator": <MenuItem action={()=>{}} checked={false}>ShrineElevator</MenuItem>,
		  
		},
		"Split Widget": {
		  "Create new JSON Session": () => console.log(),
		  "Create new Console Session": () => console.log(),
		},
		"CloseWidget": <MenuItem action={()=>{}} tooltip="Close this Widget but keep the underlying Session open.">Close Widget</MenuItem>,
		"CloseSession": <MenuItem action={()=>{}} tooltip="Close the underlying Session, which will close this Widget and all other Widgets connected to the same Session">Close Session</MenuItem>,
		"CloseAll": <MenuItem action={()=>{}} tooltip="Close all Widgets and Sessions except for the defaults">Close All Sessions</MenuItem>,
		"setting section": <hr style={{marginTop: 3, marginBottom: 3}}/>,
		"Appearance": {
		  "JSON Theme": {
			"  Default": () => console.log("open")
		  },
		  "Console Theme": {
			"   Default": () => console.log("open")
		  }
		},
		"Edit Layout": () => setEditingLayout(!isEditingLayout),
		"connect section": <hr style={{marginTop: 3, marginBottom: 3}}/>,
		"Connect to Switch": () => console.log("open"),
		"about section": <hr style={{marginTop: 3, marginBottom: 3}}/>,
		"Help...": null,
	  };

	const margin = 1;

	  //h * g + (m * (g+1)) = height
	return (
		<div className="root" onContextMenu={openContextMenu(menuConfig)}>

		<div id="main" className="main" >
			<div style={{height: "100%"}}>
				<GridLayout
					className="layout"
					layout={layouts}
					cols={Grid}
					width={mainWidth}
			
					rowHeight={(mainHeight - ((Grid+1)*margin))/Grid}
					isResizable={isEditingLayout}
					isDraggable={isEditingLayout}
					margin={[margin,margin]}
					onLayoutChange={(layouts) => setLayouts(layouts)}

				>
					{
						widgets.map((widget, i)=>(
							<div className="widget" key={i.toString()}>
								<WidgetViewer widget={widget}  />
							</div>

						))
					}
				</GridLayout>
			</div>
			

		</div>
		{contextmenu}
		</div>
	);
}

type MainGridProps = {
  editing: boolean,
  height: number
}



const getMenuConfig = () => {
  
}

export default App;
