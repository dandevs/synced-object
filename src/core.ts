import _ from "lodash";
import { observable, intercept, observe, IValueWillChange, IValueDidChange, action } from "mobx";

// TODO: Append new children to tree
export class DataCore<T=object> {
    @observable readonly data: T;
    @observable readonly tree: object;

    private readonly interceptDisposers: Set<()=>void> = new Set();
    private readonly observeDisposers: Set<()=>void> = new Set();
    private readonly events: DataEvents;

    constructor(events: DataEvents, baseData?: T) {
        this.data = _.defaultsDeep(this.data, _.cloneDeep(baseData || {}));
        this.tree = getPaths(this.data);
        this.events = events;

        // TODO: Refactor this to be able to add new children
        _.forEach(this.tree, (obj, path) => {
            const i_disposer = intercept(obj, (change) => {
                return (this.events.valueWillChange || (() => change))(change, joinPath(path, (change as any).name));
            });

            const o_disposer = observe(obj, (change) => {
                (this.events.valueDidChange || _.noop)(change, joinPath(path, (change as any).name));
            });

            this.interceptDisposers.add(i_disposer);
            this.observeDisposers.add(o_disposer);
        });
    }

    public dispose() {
        this.interceptDisposers.forEach((disposer) => disposer());
        this.observeDisposers.forEach((disposer) => disposer());

        this.interceptDisposers.clear();
        this.observeDisposers.clear();
    }

    @action public setData(newData: T) {
        this.dispose();

        _.forEach(this.data as {}, (value, key) => {
            delete this.data[key];
        });
    }
}

export interface DataEvents {
    valueWillChange?: (change: IValueWillChange<{}>, path: string) => IValueWillChange<{}>|null;
    valueDidChange?: (change: IValueDidChange<{}>, path: string) => void;
}

// ---------------------------------------------------------------------------
// Utils

function getPaths(object: Object, basePath: string = "") {
    const paths: {[key: string]: object} = {"": object};

    function f(_obj: Object, _path: string) {
        _.forEach(_obj, (value, key) => {
            if (_.isPlainObject(value)) {
                const newPath = _path.length > 0 ? `${_path}.${key}` : key;
                paths[newPath] = value;
                f(value, newPath);
            }
        });
    }

    f(object, basePath);
    return paths;
}

function joinPath(a: string, b: string) {
    return a.length > 0 ? `${a}.${b}` : b;
}