import _ from "lodash";
import { DataCore, $IIntercept } from "../core";
import { action } from "mobx";
import { fromEvent, merge, empty, Observable } from "rxjs";
import { switchMap, finalize, take, filter } from "rxjs/operators";

export class ClientData<T={}> extends DataCore<T> {
    private isInterceptingFromServer = false;
    private socket: SocketIOClient.Socket;

    private $interceptFromServer: Observable<$IIntercept>;
    private $interceptFromSelf: Observable<$IIntercept>;

    static async connect<T>(socket: SocketIOClient.Socket) {
        if (!socket.connected)
            await untilConnected();

        return new ClientData<T>(await retreiveData(), socket);

        function untilConnected() {
            return new Promise((resolve) => {
                socket.once("connect", resolve);
            });
        }

        function retreiveData(): Promise<T> {
            return new Promise((resolve) => {
                socket.emit("get-data", (data) => resolve(data));
            });
        }
    }

    constructor(baseData: T, socket: SocketIOClient.Socket) {
        super(baseData);
        this.socket = socket;

        this.$interceptFromServer = fromEvent(this.socket, "update").pipe(
            switchMap(update => {
                this.isInterceptingFromServer = true;

                return merge(
                    this.$intercept.pipe(
                        take(_.size(update)),
                        finalize(() => this.isInterceptingFromServer = false),
                    ),
                    empty().pipe(finalize(() => this.updateData(update))),
                );
            }),
        );

        this.$interceptFromSelf = this.$intercept.pipe(
            filter(() => !this.isInterceptingFromServer),
        );

        this.$interceptFromServer.subscribe(e => {
            e.acceptChange();
        });

        this.$interceptFromSelf.subscribe(e => {
            this.socket.emit("update", { [e.path]: e.change.newValue});
            e.acceptChange();
        });
    }
}