import _ from "lodash";
import { DataCore } from "../core";
import { ClientUpdateMeta } from "../interfaces";
import { action } from "mobx";

export class ClientData<T={}> {
    private readonly client: SocketIOClient.Socket;
    private readonly core: DataCore<T>;

    private changeMeta: ClientUpdateMeta = {
        origin: "client",
    };

    public get data() {
        return this.core.data;
    }

    public static async connect<T={}>(client: SocketIOClient.Socket) {
        let data: T;

        if (client.connected) {
            data = await requestData();
        }
        else {
            await getConnection();
            data = await requestData();
        }

        return new ClientData(client, data);

        //#region Utility
        function getConnection() {
            return new Promise((resolve) => {
                client.once("connect", resolve);
            });
        }

        function requestData(): Promise<T> {
            return new Promise((resolve) => {
                client.emit("request-data", (data: T) => {
                    resolve(data);
                });
            });
        }
        //#endregion
    }

    private constructor(client: SocketIOClient.Socket, baseData: T) {
        this.client = client;

        this.core = new DataCore<T>({
            valueWillChange: (change, path) => {
                if (this.changeMeta.origin === "server") {
                    return change;
                }
                else {
                    this.emitUpdate({
                        [path]: change.newValue,
                    });
                }

                return change;
            },
        },
        baseData);

        this.client.on("update", (update) => this.receiveUpdate(update));
    }

    private emitUpdate(update: {}) {
        this.client.emit("update", update);
    }

    @action private receiveUpdate(update: {}) {
        this.changeMeta.origin = "server";

        _.forEach(update, (value, path) => {
            _.set(this.data as {}, path, value);
        });

        this.changeMeta.origin = "client";
    }
}