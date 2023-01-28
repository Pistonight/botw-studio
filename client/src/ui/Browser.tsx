import { getCalloutStylePropsFromTheme } from "data/theme";
import { useMemo } from "react";
import { Theme } from "react-base16-styling";
import { useGlobal } from "store/AppGlobal";
import "./Browser.css";

type BrowserProps = {
    url: string,
    theme?: Theme,
    widgetId: number
};

export const Browser: React.FC<BrowserProps> = ({url, theme, widgetId}) => {
    const { openMenu } = useGlobal();
    const calloutStyleProps = useMemo(()=>getCalloutStylePropsFromTheme(theme), [theme]);
    return (
        <div className="browser-container">
			<iframe src={url}>
                <p>Your browser does not support iframes.</p>
            </iframe>
           <div className="browser-callout" {...calloutStyleProps} onClick={(e)=>{
                openMenu(widgetId, e);
           }}>Help (Click here for menu)</div>
		</div>
        
    )
}