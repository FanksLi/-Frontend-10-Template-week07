

// 全局存储类
export class Realm {
    constructor() {
       this.global = new Map();
       this.Object = new Map();
       this.Object.call = function() {

       };
       this.Object_prototype = new Map();
    }
}

// number string boolean object undefined symbol null
export class JSValue {
    get type() {
        if(this.constructor === JSNumber) {
            return 'Number';
        }
        if(this.constructor === JSString) {
            return 'String';
        }
        if(this.constructor === JSBoolean) {
            return 'Boolean';
        }
        if(this.constructor === JSObject) {
            return 'Object';
        }
        if(this.constructor === JSSymbol) {
            return 'Symbol';
        }
        if(this.constructor === JSUNull) {
            return 'Null';
        }
        return 'undefined';
    }
}

export class JSNumber extends JSValue {
    constructor(value) {
        super()
        this.memory = new ArrayBuffer(8);
        if(arguments.length) {
            new Float64Array(this.memory)[0] = value;
        } else {
            new Float64Array(this.memory)[0] = 0;
        }
    }
    get value() {
        return new Float64Array(this.memory)[0];
    }
    toNumber() {
        return this;
    }
    toString() {

    }
    toBoolean() {
        if(new Float64Array(this.memory)[0] === 0) 
            return new JSBoolean(false);
        else
            return new JSBoolean(true);

    }
}
export class JSString extends JSValue {
    constructor(charactes) {
        super()
        // this.memory = new ArrayBuffer(charactes.length);
        this.charactes = charactes;
    }

    toNumber() {
        //
    }
    toString() {
        return this;
    }
    toBoolean() {
        if(new Float64Array(this.charactes)[0] === 0) 
            return new JSBoolean(false);
        else
            return new JSBoolean(true);

    }
}
export class JSBoolean extends JSValue {
    constructor(value) {
        super()
        this.value = value || false;
    }
    toNumber() {
        if(this.value) 
            return new JSNumber(1);
        else 
            return new JSNumber(0);
    }
    toString() {
        if(this.value) 
            return new JSString(['t', 'r', 'u', 'e']);
        else 
            return new JSString(['f', 'a', 'l', 's', 'e']);
    }
    toBoolean() {
        return this;
    }
}
export class JSObject extends JSValue {
    constructor(proto) {
        super()
        this.properties = new Map();
        this.prototype = proto || null;
    }
    set(name, value) {
        // TODO: Writeable
        this.setProperty(name, {
            value: value,
            enumerable: true,
            configurable: true,
            writeable: true,
        });
    }
    get(name) {
        // TODO prototype chain && getter
        return this.getProperty(name).value;
    }
    setProperty(name, attributes) {
        this.properties.set(name, attributes);
    }
    getProperty(name) {
        return this.properties.get(name);
    }
    // 添加原型
    setPrototype(proto) {
        this.prototype = proto
    }
    getPrototype() {
        return this.prototype;
    }
}

export class JSSymbol extends JSValue {
    constructor(name) {
        super()
        this.name = name || '';
        this.prototype = null;
    }
}

export class JSUndefined extends JSValue {
    toNumber() {
        return new JSNumber(NaN);
    }
    toString() {
        return new JSString(['u', 'n', 'd', 'e', 'f', 'i', 'n', 'e', 'd']);
    }
    toBoolean() {
        return new JSBoolean(false);
    }
}
export class JSNull extends JSValue {
    toNumber() {
        return new JSNumber(0);
    }
    toString() {
        return new JSString(['n', 'u', 'l', 'l']);
    }
    toBoolean() {
        return new JSBoolean(false);
    }
}

// export class EnvironmentRecord {
//     constructor() {
//        this.thisValue;
//        this.variables = new Map();
//        this.outer = null;
//     }
// }

export class ExecutionContext {
    constructor(realm, lexicalEnvironment, variableEnvironment) {
        variableEnvironment = variableEnvironment || lexicalEnvironment;
        this.lexicalEnvironment = lexicalEnvironment;
        this.variableEnvironment = variableEnvironment;
        this.realm = realm;
    }
}

export class Reference {
    constructor(object, property) {
        this.object = object;
        this.property = property;
    }
    set(value) {
        this.object.set(this.property, value);
    }
    get() {
        return this.object.get(this.property);
    }
}

export class CompletionRecord {
    constructor(value, type, target) {
        this.value = value || new JSUndefined;
        this.type = type || 'normal';
        this.target = target || null;
    }
}

export class EnvironmentRecord {
    constructor(outer) {
        this.outer = outer;
        this.variables = new Map;
    }
    add(name) {
        this.variables.set(name, new JSUndefined);
    }
    get(name) {
        if(this.variables.has(name)) {
            return this.variables.get(name);
        } else if(this.outer) {
            return this.outer.get(name);
        } else {
            return new JSUndefined;
        }
    }
    set(name, value= new JSUndefined) {
        if(this.variables.has(name)) {
            return this.variables.set(name, value);
        } else if(this.outer) {
            return this.outer.set(name, value);
        } else {
            return this.variables.set(name, value);
        }
    }
}

export class ObjectEnvironmentRecord {
    constructor(object) {
        this.object = object;
    }
    add(name) {
        this.object.set(name, new JSUndefined);
    }
    get(name) {
        return this.object.get(name);
    }
    set(name, value= new JSUndefined) {
        this.object.set(name, value);
    }
}