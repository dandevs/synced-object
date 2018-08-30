import "reflect-metadata";
import ServerIO from "socket.io";
import ClientIO from "socket.io-client";
import getPort from "get-port";
import { ServerData } from "../src/server";
import sleep from "then-sleep";
import { ClientData } from "../src/client";
import { when } from "mobx";

it("Server Works", async () => {
    jest.setTimeout(300);

    const baseData = {
        foo: "bar",
        hello: {
            world: "welcome!",
        },
    };

    const port         = await getPort(),
          socketServer = ServerIO(port),
          uri          = `http://localhost:${port}/`;

    const serverData = new ServerData(socketServer, baseData);

    const socketClientA = ClientIO(uri);
    const socketClientB = ClientIO(uri);

    const clientDataA = await ClientData.connect<typeof baseData>(socketClientA);
    const clientDataB = await ClientData.connect<typeof baseData>(socketClientB);

    clientDataA.data.foo = "test";

    await Promise.all([
        when(() => serverData.data.foo === "test"),
        when(() => clientDataB.data.foo === "test"),
    ]);

    serverData.data.foo = "foobar";
    await when(() => serverData.data.foo === "foobar");

    socketServer.close();
    socketClientA.close();
    socketClientB.close();
});