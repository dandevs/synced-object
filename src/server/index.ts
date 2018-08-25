import _ from "lodash";
import { toJS, action } from "mobx";
import { DataCore } from "../core";
import { DataUpdate } from "../interfaces";

export class ServerData<T> {
    private readonly core: DataCore<T>;
    public readonly socketServer: SocketIO.Server;

    public get data() {
        return this.core.data;
    }

    constructor(socketServer: SocketIO.Server, baseData?: T) {
        this.socketServer = socketServer;
        this.core = new DataCore({
            valueWillChange: (change, path) => {
                return change;
            },

            valueDidChange: (change, path) => {
                this.socketServer;

                _.forEach(this.socketServer.clients().sockets, (socket, id) => {
                    socket.emit("update", {[path]: change.newValue});
                });
            },
        }, baseData);

        this.socketServer.on("update", (socket: SocketIO.Socket) => {
            console.log(socket);
        });

        this.socketServer.on("connection", (socket) => {
            this.attachSocketEvents(socket);
        });
    }

    @action private receiveUpdate(socket: SocketIO.Socket, update: {}) {
        _.forEach(update, (value, path) => {
            _.set(this.data as any, path, value);
        });
    }

    private attachSocketEvents(socket: SocketIO.Socket) {
        socket.on("request-data", (returnData: (data: T) => void) => {
            returnData(toJS(this.data));
        });

        socket.on("update", (update: {}) => {
            this.receiveUpdate(socket, update);
        });
    }
}

