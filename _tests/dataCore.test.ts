import { DataCore } from "../src/core";

it("Works", () => {
    const core = new DataCore({
        foo: "bar",
        deep: {
            sea: "water"
        }
    });

    core.$intercept.subscribe(event => {
        event.change.newValue += "!";
        event.acceptChange();
    });

    core.data.foo = "fubar";
    expect(core.data.foo).toEqual("fubar!");
});