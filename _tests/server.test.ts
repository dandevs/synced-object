import ServerIO from "socket.io";
import ClientIO from "socket.io-client";
import getPort from "get-port";
import { ServerData } from "../src/server";
import sleep from "then-sleep";
import { ClientData } from "../src/client";
import { when, reaction } from "mobx";

it.only("Server Works", async () => {
    const baseData = {
        foo: "bar",
        hello: {
            world: "welcome!"
        }
    };

    const port         = await getPort(),
          socketServer = ServerIO(port),
          uri          = `http://localhost:${port}/`;

    const serverData = new ServerData(socketServer, baseData),
          data       = serverData.data;

    const clientData = await ClientData.connect<typeof baseData>(ClientIO(uri));

    serverData.data.foo = "huh?";
    clientData.data.foo = "foobar!";

    // await sleep(30);

    // console.log(clientData.data.foo);
    // console.log(serverData.data.foo);
});