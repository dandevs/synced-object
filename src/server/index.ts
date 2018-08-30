import _ from "lodash";
import { toJS, action } from "mobx";
import { DataCore } from "../core";
import { Subject, merge, empty, of, zip, combineLatest } from "rxjs";
import { switchMap, finalize, map, share, windowToggle, mergeAll, take, filter } from "rxjs/operators";

export class ServerData<T={}> extends DataCore<T> {
    private socketServer: SocketIO.Server;
    private isInterceptingFromSocket = false;

    private $receiveDataUpdate = new Subject<$UpdateStreamInfo>();

    private $interceptFromSocket = this.$receiveDataUpdate.pipe(
        switchMap(sender => {
            this.isInterceptingFromSocket = true;

            return merge(
                this.$intercept.pipe(
                    take(_.size(sender.update)),
                    map(intercept => ({ intercept, sender })),
                    finalize(() => this.isInterceptingFromSocket = false),
                ),
                empty().pipe(finalize(() => this.updateData(sender.update))),
            );
        }),
        share(),
    );

    private $interceptFromSelf = this.$intercept.pipe(
        filter(() => !this.isInterceptingFromSocket),
    );

    constructor(socketServer: SocketIO.Server, baseData?: T) {
        super(baseData);
        this.socketServer = socketServer;

        this.socketServer.on("connection", (socket) => {
            socket.on("update", (updateData: {}) => {
                this.$receiveDataUpdate.next({
                    socket: socket,
                    update: updateData,
                });
            });

            socket.on("get-data", (send: (data: T) => void) => {
                send(toJS(this.data));
            });
        });

        this.$interceptFromSocket.subscribe(e => {
            e.intercept.acceptChange();
            e.sender.socket.broadcast.emit("update", e.sender.update);
        });

        this.$interceptFromSelf.subscribe(e => {
            e.acceptChange();
        });
    }
}

type $UpdateStreamInfo = {
    socket: SocketIO.Socket,
    update: {},
};
