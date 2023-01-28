import { getCalloutStylePropsFromTheme } from "data/theme";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Theme } from "react-base16-styling";
import "./Console.css";
export type ConsoleProps = {
	theme?: Theme,
    content: string,
}
export const Console: React.FC<ConsoleProps> = ({content, theme}) => {
	const [pausedContent, setPausedContent] = useState<string|null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const displayContent = pausedContent ?? content;

	const styleProps = useMemo(()=>getCalloutStylePropsFromTheme(theme), [theme]);

	useLayoutEffect(() => {
		if (!pausedContent && textAreaRef && textAreaRef.current) {
			const { scrollHeight, offsetHeight } = textAreaRef.current;
			textAreaRef.current.scrollTop = scrollHeight - offsetHeight;
		}
	}, [content, pausedContent, textAreaRef]);

	return (
		<div className="console-container">
			<textarea
				ref={textAreaRef}
				className="console"
				value={displayContent}
				readOnly 
				onWheel={(e)=>{
					if (!pausedContent){
						if (e.deltaY < 0) {
							setPausedContent(content);
						}
					}
				}}
				onScroll={(e)=>{
					const { scrollTop, scrollHeight, offsetHeight } = e.target as HTMLTextAreaElement;
					if (pausedContent){
						if (scrollTop + offsetHeight >= scrollHeight) {
							setPausedContent(null);
						}
					}
				}}
			/>
			
			{pausedContent && <div className="console-callout" {...styleProps} onClick={()=>{
				setPausedContent(null);
			}}>Click here to unfreeze output</div>}
		</div>
	);
};