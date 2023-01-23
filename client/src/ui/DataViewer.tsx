import { useCallback } from "react";
import { Theme } from "react-base16-styling";
import ReactJson, { InteractionProps } from "react-json-view";

export type DataViewerProps = {
    data: Record<string, unknown>,
    setData: (newData: Record<string, unknown>) => void,
    rootName: string,
    theme?: Theme
}

export const DataViewer: React.FC<DataViewerProps> = ({
	data,
	rootName,
	theme,
	setData
}) => {

	const updateFunction = useCallback(({updated_src}: InteractionProps) => {
		setData(updated_src as any);
	}, [setData]);

	return (
		<ReactJson
			style={{width: "100%"}}
			src={data}
			name={rootName}
			theme={theme as any}
			onEdit={updateFunction}
		/>
	);
};