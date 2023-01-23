import "./Console.css";
export type ConsoleProps = {
    content: string,
    paused: boolean
}
export const Console: React.FC<ConsoleProps> = ({content, paused}) => {
	return (
		<textarea className="console" value={content} readOnly/>            
	);
};