import { useCallback } from "react";
import { Theme } from "react-base16-styling";
import ReactJson, { InteractionProps } from "react-json-view";

export type DataViewerProps = {
    data: Record<string, unknown>,
    setData: (newData: Record<string, unknown>) => void,
	isReadonly: boolean,
    rootName: string,
    theme?: Theme
}

export const DataViewer: React.FC<DataViewerProps> = ({
	data,
	rootName,
	theme,
	isReadonly,
	setData
}) => {

	const updateFunction = useCallback(({updated_src}: InteractionProps) => {
		setData(updated_src as any);
	}, [setData]);

	return (
		<ReactJson
			iconStyle="square"
			style={{width: "100%"}}
			quotesOnKeys={false}
			displayObjectSize={isReadonly} // Only display object size for output
			displayDataTypes={!isReadonly} // Only display type for input
			src={data}
			name={rootName}
			theme={theme as any}
			onEdit={!isReadonly && updateFunction}
			onAdd={!isReadonly && updateFunction}
			onDelete={!isReadonly && updateFunction}
		/>
	);
};