import { useMemo } from "react"
import { Theme } from "react-base16-styling"
import { ThreeCircles } from "react-loader-spinner"
import { getLoadingStylePropsFromTheme } from "./theme"
import "./Loading.css";

export type LoadingProps = {
    theme: Theme
}

export const Loading: React.FC<LoadingProps> = ({theme}) => {
    const styleProps = useMemo(()=>getLoadingStylePropsFromTheme(theme), [theme]);
    const {style: {color}} = styleProps;

    return (
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
    )
}