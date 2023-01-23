// A lightweight Typescript fork of https://github.com/tetranoir/contextmenu
// It's not compatible with the existing npm package
// The menu config has been changed to accept an array instead of object
import React, { useState, useRef, useLayoutEffect, useMemo, useCallback, PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';
import "./ContextMenu.css";

// [Text, action, tooltip, props]
type SimpleMenuData<RendererProps> = [string, (()=>void) | undefined, string | undefined, RendererProps];

// [Text, submenu]
type SubMenuData<RendererProps> = [string, MenuData<RendererProps>[], RendererProps];
type SeparatorData = "separator";
export type MenuData<RendererProps = Record<string,never>> = SimpleMenuData<RendererProps> | SubMenuData<RendererProps> | SeparatorData;

function isSimpleMenuData<T>(data: MenuData<T>): data is SimpleMenuData<T> { 
	return data[1] === undefined || typeof data[1] === "function"
}

function isSubMenuData<T>(data: MenuData<T>): data is SubMenuData<T> { 
	return Array.isArray(data[1]);
}

type MenuLocation = {
	top: number,
	left: number
};

type SubMenu = {
	ref: React.RefObject<HTMLDivElement>,
	style: React.CSSProperties
}

const getMenuPosition = (triggerLocation: MenuLocation, element: HTMLDivElement): MenuLocation => {
	if (!element) {
		return { left: 0, top: 0 };
	}

	const { scrollX, scrollY, innerWidth, innerHeight } = window;
	const { offsetWidth: menuWidth, offsetHeight: menuHeight } = element;

	let { left, top } = triggerLocation;

	const screenMaxX = scrollX + innerWidth;
	if (left + menuWidth > screenMaxX) {
		left = screenMaxX - menuWidth;
	}

	const screenMaxY = scrollY + innerHeight;
	if (top + menuHeight > screenMaxY) {
		top = screenMaxY - menuHeight;
	}

	return { left, top };
}

const getSubmenuStyles = (element: HTMLDivElement): [React.CSSProperties, boolean] => {
	const { scrollX, scrollY, innerWidth, innerHeight } = window;
	const { width, height, x, y } = element.getBoundingClientRect();
	
	const style: React.CSSProperties = {};
	let needsUpdate = false;

	if (width + x > innerWidth + scrollX) {
		style.right = 0;
		style.left = 'unset';
		style.marginRight = '100%';
		needsUpdate = true;
	}

	if (height + y > innerHeight + scrollY) {
		style.top = innerHeight + scrollY - height - y - 3;
		needsUpdate = true;
	}
	return [style, needsUpdate];
}

const useSubmenus = (maxDepth: number) => {
	const [path, setPathInState] = useState<null | string[]>(null);

	const [submenus, setSubMenus] = useState<SubMenu[]>(()=>Array.from({length: maxDepth}, _=>{
		return {
			ref: React.createRef<HTMLDivElement>(),
			style: {}
		}
	}));

	useLayoutEffect(() => {
		if(path){
			const updateInfo: [React.CSSProperties, boolean][] = submenus.map((submenu, i)=>{
				if (i >= path.length) {
					return [submenu.style, false];
				}
				if (!submenu.ref || !submenu.ref.current){
					return [submenu.style, false];
				}
				return getSubmenuStyles(submenu.ref.current);
			});
			if(updateInfo.find(([_, needsUpdate])=>needsUpdate)){
				setSubMenus(submenus.map((submenu, i)=>(
					{...submenu, style: updateInfo[i][0]}
				)));
			}
			
		}
	}, [path, submenus]);

	const setPath = useCallback((newPath: null | string[]) => {
		// Revert all style adjustments
		setSubMenus(submenus.map((submenu)=>(
			{...submenu, style: {}}
		)));
		setPathInState(newPath);
	}, [submenus]);

	return {
		path,
		setPath,
		submenus
	};
}

type HandleHover = (currentPath: string[]) => void;
/*  renderMenuItem
- current path: is the current menu path
- remaining paht: is the remaining path left after traversing
*/
function renderMenuItem<RendererProps>(
	// Submenu structs
	submenus: SubMenu[],
	// The menu item to render
	item: MenuData<RendererProps>,
	// Renderer for menu items
	Renderer: React.ComponentType<PropsWithChildren<RendererProps>> | undefined,
	// Renderer for separators
	Separator: React.ComponentType | undefined,
	// Submenu symbol
	submenuSymbol: string,
	// Handle hovering over menu items
	handleHover: HandleHover,
	// Current path. [] for no submenu opened, ["foo", "bar"] if root > foo > bar are opened (3 menus total)
	path: string[],
	// Current render depth, 0 for root.
	depth: number, 
	i: number,
) {
	// Separator
	if (item === "separator") {
		return Separator ? <Separator key={'line' + i}/> : <hr key={'line' + i}/>
	}

	// Simple Action
	if (isSimpleMenuData(item)) {
		const [text, action, tooltip, props] = item;
		if (action) {
			return (
				<div key={text} title={tooltip}
					className="menuItem"
					onMouseDown={() => {
						action();
					}}
					onMouseEnter={() => handleHover(path.slice(0, depth))}
				>
					{
						Renderer ? <Renderer {...props}>{text}</Renderer> : text
					}
				</div>
			);
		}
		// Disabled
		return (
			<div key={text} title={tooltip} className="menuItem disabled">
				{
					Renderer ? <Renderer {...props} >{text}</Renderer> : text
				}
			</div>
		);
		
	}

	// Submenu
	if (isSubMenuData(item)) {
		const [text, submenuItems, props] = item;
		if (path[depth] === text) {
			// Opened Submenu
			return (
				<div key={text} className="menuItem rightShift highlight flex">
					<div>
					{
						Renderer ? <Renderer {...props}>{text}</Renderer> : text
					}
					</div>
					<div>&nbsp;&nbsp;{submenuSymbol}</div>
					{
						renderSubmenu<RendererProps>(
							submenuItems,
							submenus,
							Renderer,
							Separator,
							submenuSymbol,
							handleHover,
							path,
							depth + 1
						)
					}
				</div>
			);
		}
		// Collapsed submenu
		return (
			<div key={text} className="menuItem rightShift flex" onMouseEnter={()=>handleHover([...path.slice(0, depth), text])}>
				<div>
					{
						Renderer ? <Renderer {...props}>{text}</Renderer> : text
					}
				</div>
				<div>&nbsp;&nbsp;{submenuSymbol}</div>
			</div>
		);
	}

	return null;

}

function renderSubmenu<RendererProps>(
	menu: MenuData<RendererProps>[],
	submenus: SubMenu[],
	Renderer: React.ComponentType<PropsWithChildren<RendererProps>> | undefined,
	Separator: React.ComponentType | undefined,
	submenuSymbol: string,
	handleHover: HandleHover,
	currentPath: string[],
	depth: number
) {

	return (
		<div ref={submenus[depth-1].ref} className="submenu" style={{
			...submenus[depth-1].style,
			zIndex: depth*10
		}}>
			{
				menu.map((item, i) => (
					renderMenuItem(
						submenus,
						item,
						Renderer,
						Separator,
						submenuSymbol,
						handleHover,
						currentPath,
						depth,
						i
					)
				))
			}
		</div>
	);
}

export type ContextMenuSetting<RendererProps> = {
	submenuSymbol: string,
	depth: number,
	renderer?: React.ComponentType<PropsWithChildren<RendererProps>>,
	separator?: React.ComponentType,
	onOpen: () => void,
	onClose: () => void
}

const DefaultSettings = {
	submenuSymbol: ">",
	depth: 3,
	onOpen: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
	onClose: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
};

export function useContextMenu<RendererProps = Record<string, never>>(settings?: Partial<ContextMenuSetting<RendererProps>>) {
	
	const combinedSettings = useMemo(()=>({
		...DefaultSettings,
		...(settings ?? {})
	}), [settings]);

	const [menuData, setMenuData] = useState<MenuData<RendererProps>[]>([]);
	const [triggerLocation, setTriggerLocation] = useState<MenuLocation>({ top: 0, left: 0 }); 
	const [displayLocation, setDisplayLocation] = useState<MenuLocation>({ top: 0, left: 0 }); 
	
	const menuRef = useRef<HTMLDivElement>(null);
	const {
		submenus,
		path,
		setPath
	} = useSubmenus(combinedSettings.depth);

	// Handle menu open
	useLayoutEffect(() => {
		const closeMenu = () => {
			unregisterListeners();
			setPath(null);
		};
		document.addEventListener('mousedown', closeMenu);
		document.addEventListener('touchstart', closeMenu);
		document.addEventListener('scroll', closeMenu);
		document.addEventListener('contextmenu', closeMenu);
		window.addEventListener('resize', closeMenu);
		const unregisterListeners = () => {
			document.removeEventListener('mousedown', closeMenu);
			document.removeEventListener('touchstart', closeMenu);
			document.removeEventListener('scroll', closeMenu);
			document.removeEventListener('contextmenu', closeMenu);
			window.removeEventListener('resize', closeMenu);
		}
		if (menuRef.current) {
			setDisplayLocation(getMenuPosition(triggerLocation, menuRef.current));
		}else{
			// error case. menuRef.current should always be valid
			setDisplayLocation(triggerLocation);
		}
		
		combinedSettings.onOpen();
		return unregisterListeners;
	}, [combinedSettings, menuRef, triggerLocation]);

	const contextMenuHandler = useCallback((menu: MenuData<RendererProps>[]) => {
		return (e: React.MouseEvent) => {
			setMenuData(menu);
			setTriggerLocation({ left: e.pageX, top: e.pageY });
			setPath([]);

			e.preventDefault();
			e.stopPropagation();
		}
		
	}, []);

	const menuComponent = useMemo(()=>{
		if (!path){
			return null;
		}
		return (
			<div ref={menuRef} className="menu" style={displayLocation}>
				{
					menuData.map((item, i) => (
						renderMenuItem(
							submenus,
							item,
							combinedSettings.renderer,
							combinedSettings.separator,
							combinedSettings.submenuSymbol,
							setPath,
							path,
							0,
							i
						)
					))
				}
			</div>
		);
	}, [path, menuData, submenus, menuRef, displayLocation, combinedSettings, setPath])

	return [ReactDOM.createPortal(menuComponent, document.body), contextMenuHandler] as const;
}


/* use case
	function MyComponent(props) {
		const [contextMenuRender, useContextMenu] = useContextMenu(...menu settings...);
		return <div onContextMenu={handleContextMenu}>my component{contextMenuRender}</div>
	}
*/
