import { Socket } from "net";


let socket: Socket | null = null;
export const connectToSwitch = (host: string, port: number) => {
    if(socket){
        socket.destroy();
    }

    socket = new Socket();
    socket.connect(port, host);

    socket.on("connect", () => {
        console.log("Connected to switch");
    
    });

    socket.on("error" , (err) => {
        console.log(err);
    });

    socket.on("data", (data) => {
        console.log(data.buffer);
    });
    socket.on("close", ()=>{
        console.log("Disconnected from switch");
    })
}