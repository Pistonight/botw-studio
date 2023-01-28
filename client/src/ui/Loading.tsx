import { useMemo } from "react";
import { Theme } from "react-base16-styling";
import { ThreeCircles } from "react-loader-spinner";
import { getCalloutStylePropsFromTheme, getLoadingStylePropsFromTheme } from "../data/theme";
import "./Loading.css";

export type LoadingProps = {
    theme?: Theme
	title: string
}

export const Loading: React.FC<LoadingProps> = ({title, theme}) => {
	const styleProps = useMemo(()=>getLoadingStylePropsFromTheme(theme), [theme]);
	const calloutStyleProps = useMemo(()=>getCalloutStylePropsFromTheme(theme), [theme]);

	const {style: {color}} = styleProps;

	return (
		<div className="loading-container">
			<ThreeCircles
			height="50"
			width="50"
			color={color}
			wrapperClass="loading-spinner-container"
			visible={true}
			ariaLabel="three-circles-rotating"
			outerCircleColor=""
			innerCircleColor=""
			middleCircleColor=""
		/>
           <div className="loading-callout" {...calloutStyleProps}>{title}</div>
		</div>
	);
};