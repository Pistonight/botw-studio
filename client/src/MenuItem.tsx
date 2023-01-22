import { PropsWithChildren } from "react";
import "./MenuItem.css";

export type MenuItemProps = {
    checked?: boolean,
    tooltip?: string,
    action: () => void
};

export const MenuItem: React.FC<PropsWithChildren<MenuItemProps>> = ({checked, tooltip, action, children}) => {
    if (checked === undefined) {
        return <div title={tooltip} className="menuItem">{children}</div>;
    }
    return (
        <ul className="menuItem" style={{listStyleType: checked ? "disc" : "none"}}>
            <li title={tooltip}>
                {children}
            </li>
        </ul>
    )
}