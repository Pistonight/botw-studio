import { useEffect, useState } from "react";
import { PromptProps } from "store/api";
import "./Prompt.css";

export const Prompt: React.FC<PromptProps> = ({prompt, defaultValue, onEnter, onCancel}) => {
    const [value, setValue] = useState<string>("");
    useEffect(()=>{
        setValue(defaultValue ?? "");
    }, [defaultValue])
    return (
        <div className="prompt-container">
            <div className="prompt-item prompt-text">
                {prompt}
            </div>
            <div className="prompt-item prompt-input">
                <input value={value} type="text" onChange={(e)=>{
                    setValue(e.target.value);
                }} onKeyDown={(e)=>{
                    if(e.key === "Enter") {
                        onEnter(value);
                    }
                }}/>
            </div>
            <div className="prompt-item prompt-actions">
                <button className="prompt-button" onClick={()=>onEnter(value)}>Ok</button>
                <button className="prompt-button" onClick={()=>onCancel()}>Cancel</button>
            </div>
        </div>
    )
}