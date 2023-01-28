import { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";

export type PromptProps = {
    prompt?: string,
    defaultValue?: string,
    onEnter: (value: string) => void,
    onCancel: () => void
}

export const usePromptApi = (zIndex: number, Renderer: React.ComponentType<PromptProps>) => {
    const [prompt, setPrompt] = useState<string|undefined>(undefined);
    const [defaultValue, setDefaultValue] = useState<string|undefined>(undefined);
    const [onEnter, setOnEnter] = useState<((value: string) => void)>(()=>()=>{/* empty */});
    const [onCancel, setOnCancel] = useState<(()=>void)>(()=>()=>{/* empty */});

    const openPrompt = useCallback((prompt: string, defaultValue: string, onEnter: (value: string) => void, onCancel?:()=>void)=>{
        setPrompt(prompt);
        setDefaultValue(defaultValue);
        setOnEnter(()=>(value: string) => {
            onEnter(value);
            setPrompt(undefined);
        });
        setOnCancel(()=>()=>{
            onCancel && onCancel();
            setPrompt(undefined);
        });
    }, []);

    const promptComponent = useMemo(()=>{
		if (!prompt){
			return null;
		}
		return ReactDOM.createPortal((
			<div style={{
                position: "absolute",
                zIndex,
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "#00000066"
            }}>
				<Renderer
                    prompt={prompt}
                    defaultValue={defaultValue}
                    onEnter={onEnter}
                    onCancel={onCancel}
                />
			</div>
		), document.body);
	}, [prompt, defaultValue, onEnter, onCancel]);

	return useMemo(()=>({
        prompt: promptComponent,
        openPrompt
    }),[
        prompt,
        openPrompt
    ]);
}

export type PromptApi = Readonly<ReturnType<typeof usePromptApi>>;