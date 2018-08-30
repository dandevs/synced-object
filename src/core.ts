import _ from "lodash";
import { Observable, Subject } from "rxjs";
import { observable, intercept, observe, IValueWillChange, IValueDidChange, action } from "mobx";

// TODO: Append new children to tree
export class DataCore<T=object> {
    @observable public data: T;
    @observable private tree: {};

    $intercept: Observable<$IIntercept>;
    $observe: Observable<IValueDidChangeWithPath>;

    constructor(baseData: T) {
        this.data = _.cloneDeep(baseData) || {} as T;
        this.tree = getPaths(this.data);
        this.initStreams();
    }

    private initStreams() {
        const $interceptSubject = new Subject<$IIntercept>();
        const $observeSubject   = new Subject<IValueDidChangeWithPath>();

        _.forEach(this.tree, (value, path) => {
            intercept(value, (change) => {
                let accepted = false;
                const acceptChange = () => accepted = true;

                $interceptSubject.next({
                    change, path: joinPath(path, (change as any).name), acceptChange,
                });

                return accepted ? change : null;
            });

            observe(value, (change: IValueDidChangeWithPath) => {
                change.path = joinPath(path, change.name);
                $observeSubject.next(change);
            });
        });

        this.$intercept = $interceptSubject.pipe();
        this.$observe   = $observeSubject.pipe();
    }

    @action.bound protected updateData(update: {}) {
        _.forEach(update, (value, path) => {
            _.set(this.data as {}, path, value);
        });
    }
}

export type $IIntercept = {
    acceptChange: () => void;
    change:       IValueWillChange<{}>,
    path:         string;
};

export type IValueDidChangeWithPath = IValueDidChange<{}> & {
    path: string;
    name: string;
};

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