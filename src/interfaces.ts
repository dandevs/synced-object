export interface DataUpdate {
    value:  any;
    author: SocketIO.Socket;
}

export interface ChangeMeta {
    socket?:   SocketIO.Socket;
    fromSelf?: boolean;
    isValid?:  boolean;
}

export interface ClientUpdateMeta {
    origin: "client" | "server";
}