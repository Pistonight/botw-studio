import { useMemo } from "react";
import { Base16Theme, Theme } from "react-base16-styling";
import { useGlobal } from "store/AppGlobal";
import { isConsoleSession, Session, Widget } from "store/type";
import { Loading } from "./Loading";
import { getWidgetStylePropsFromTheme } from "./theme";
import clsx from "clsx";
import { Console } from "./Console";
import "./Widget.css";

export type WidgetProps = {
    widget: Widget
};

export const WidgetViewer: React.FC<WidgetProps> = ({widget}) => {
    const { theme, sessionName } = widget;
    const { sessions } = useGlobal();

    const session = sessions[sessionName];
    let content: JSX.Element;
    let sessionClass = "";
    if(!session) {
        content = <Loading theme={theme} />;
    }else if(isConsoleSession(session)) {
        content = <Console content={session.data} paused={false} />;
        sessionClass = "console-session";
    }else{
        content = <>TODO</>;
        sessionClass = "data-session";
    }
    const styleProps = useMemo(()=>getWidgetStylePropsFromTheme(theme), [theme]);

    return (
        <div className={clsx("widget-content", sessionClass)} {...styleProps}>
            {content}            
        </div>
    );
    
}

{/* <ReactJson style={{width: "100%"}}src={{
            connection: {
                host: "localhost",
                port: "65433"
            },
            }} name={null} theme="monokai"/> */}