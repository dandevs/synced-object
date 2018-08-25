import { DataCore } from "../src/core";
import { IObjectDidChange } from "mobx";

describe("Data Core", () => {
    const baseData = {
        foo: "bar",
        baz: {
            hello: "world",
            deep: {
                again: "yes"
            }
        }
    };

    it("Works", () => {
        const core = new DataCore({
            valueWillChange(change, path) {
                change.newValue += " world";
                return change;
            }
        }, baseData);

        core.data.foo = "test";
        core.data.baz.deep.again = "what";

        expect(core.data.foo).toEqual("test world");
        expect(core.data.baz.deep.again).toEqual("what world");

        core.dispose();

        core.data.foo = "blap";
        expect(core.data.foo).toEqual("blap");
    });
});