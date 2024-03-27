require('dotenv').config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import userRoutes from "./routes/user.routes";
import permissionRoutes from "./routes/permission.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import roleRoutes from "./routes/role.routes";
import cookieParser from "cookie-parser";


// import { router as roomRoutes } from "./routes/roomRoutes.js";
import roomRoutes from "./routes/room.routes";
import messageRoutes from "./routes/message.routes";
import reminderRoutes from "./routes/reminder.routes";
import patientRoutes from "./routes/patient.routes";


import { myDataSource } from "./app-data-source"

import { productSeed } from './seeds/product.seed';
import { orderSeed } from './seeds/order.seed';
import { log } from './utils/log';
import { Server } from 'socket.io';
import http from "http";

import fileUpload from 'express-fileupload';
import path from 'path';


declare global {
    var onlineUsers:  Map<{ userId : number, currentRoom : number | undefined}, string>;
    // var onlineUsers:  Map<number, string>;
    var chatSocket: any;
}

global.onlineUsers = new Map<{ userId : number, currentRoom : number | undefined}, string>();

// establish database connection
myDataSource
    .initialize()
    .then(async () => {
        // productSeed()
        // orderSeed()

        console.log('INFO :: Data Source has been initialized');
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err)
    })
const apiUrl = process.env.API_URL;
const expressPort = process.env.WEB_PORT || 8080;
const app = express();

// default options
app.use(fileUpload({ uriDecodeFileNames: true }));
// use json for API routes
app.use(express.json());
// cors for api address/port
app.use(cors({
    credentials: true,
    origin: ["http://localhost:3000","https://gapcure.vercel.app","http://localhost:3000","https://gapcure.vercel.app"],
    methods:['GET','POST','PATCH','PUT','DELETE']
}));

// cookieParser middleware
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
    console.log(req.cookies)
    res.send('INFO :: Root route called');
});

// app.listen(expressPort, () => {
//     console.log('INFO :: Webserver started on port ' + expressPort)
// });

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.ORIGIN_URL,
        methods: ["GET", "POST"],
        credentials:true
    },
    maxHttpBufferSize: 2e7,
});

let roomUsers: Record<string, string[]> = {};

io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user",(data) => {
        let userData = {
            userId: data.userId,
            currentRoom: data.currentRoom
        }
        onlineUsers.forEach((value,key)=>
        {
            if(key.userId == data.userId){
                onlineUsers.delete(key);      
            }
            if(value == socket.id){
                onlineUsers.delete(key);
            }
        });
        onlineUsers.set(userData, socket.id)
        io.sockets.emit("online-users",{
            onlineUsers:[...onlineUsers],
            userId: userData.userId
        });
    })
    socket.on("user-read-chat",(data) => {
        let readData = {
            room_id: data.room_id,
            readBy: data.readBy
        }
        io.sockets.emit("chat-read",readData);
    })
    socket.on("send-msg",(data) => {
        let sendUserSocket: string[] = [];
        onlineUsers.forEach((userData : string,keyObj : any) => {
            if(keyObj.userId == data.message.receiver.id){
                sendUserSocket.push(userData);
            }
        });
        if(sendUserSocket.length){
            var uniqSockets = [ ...new Set(sendUserSocket) ];
            socket.to(uniqSockets).emit("msg-receive",{
                room_id:data.room_id,
                message:data.message,
                senderRooms:data.senderRooms,
                unreadSenderMessages:data.unreadSenderMessages,
                receiverRooms:data.receiverRooms,
                unreadReceiverMessages:data.unreadReceiverMessages,
            })
        }
    })
    socket.on("disconnect", () => {
        console.log("User Disconnected " + socket.id);

        onlineUsers.forEach((value,key)=>
        {
            if(value == socket.id){
                onlineUsers.delete(key);
            }
        });
        // let filterValues = new Map<{ userId : number, currentRoom : number | undefined}, string>();
        // [...onlineUsers].forEach(item =>
        // {
        //     if(item[1] !== socket.id){
        //         filterValues.set(item[0],item[1]);
        //     }
        // });
        // onlineUsers.clear();
        // [...filterValues].forEach(item => {
        //     onlineUsers.set(item[0],item[1]);
        // });
        io.sockets.emit("online-users",{
            onlineUsers:[...onlineUsers]
        });
    });




    // io.emit("users_response", roomUsers);
    // log(`User Connected: ${socket.id}`);

    // socket.on("join_room", (roomId: string) => {
    //     socket.join(roomId);
    //     roomUsers = {
    //         ...roomUsers,
    //         [roomId]: [...(roomUsers[roomId] ?? []), socket.id],
    //     };

    //     io.emit("users_response", roomUsers);
    //     log(`User with ID: ${socket.id} joined room: ${roomId}`);
    // });

    // socket.on("send_message", (data) => {
    //     io.emit("receive_message", data);
    // });

    // socket.on("typing", (data) => {
    //     socket.broadcast.emit("typing_response", data);
    // });

    // socket.on("disconnect", () => {
    //     log("User Disconnected " + socket.id);
    //     for (const [roomId, users] of Object.entries(roomUsers)) {
    //         if (users.includes(socket.id)) {
    //             roomUsers[roomId] = [...users.filter((id) => id !== socket.id)];
    //             io.emit("receive_message", {
    //                 text: "A user left the room.",
    //                 socketId: "kurakani",
    //                 roomId: roomId,
    //             });
    //         }
    //     }
    //     io.emit("users_response", roomUsers);
    // });
});


// import routes from router
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', permissionRoutes);
app.use('/api', productRoutes);
app.use('/api', roleRoutes);
app.use('/api', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', reminderRoutes);
app.use('/api', patientRoutes);
app.use('/uploads/video/',express.static(path.join(__dirname, '/../uploads/video')));
app.use('/uploads/photo/',express.static(path.join(__dirname, '/../uploads/photo')));
app.use('/uploads/audio/',express.static(path.join(__dirname, '/../uploads/audio')));
server.listen(expressPort, () => {
    console.log('INFO :: Webserver started on port ' + expressPort)
});


