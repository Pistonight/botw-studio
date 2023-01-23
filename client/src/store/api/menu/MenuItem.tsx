import { PropsWithChildren } from "react";
import "./MenuItem.css";

export type MenuItemProps = {
    checked?: boolean,
};

export const MenuItem: React.FC<PropsWithChildren<MenuItemProps>> = ({checked, children}) => {
	if (checked === undefined) {
		return <>{children}</>;
	}
	return (
		<ul className="toggleItem" style={{listStyleType: checked ? "disc" : "none"}}>
			<li>
				{children}
			</li>
		</ul>
	);
};