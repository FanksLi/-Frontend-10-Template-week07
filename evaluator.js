import {
    Realm,
    Reference, 
    ExecutionContext,
    JSNumber,
    JSString,
    JSBoolean,
    JSObject,
    JSSymbol,
    JSNull,
    JSUndefined,
    CompletionRecord,
    EnvironmentRecord,
    ObjectEnvironmentRecord
} from './runtime.js'

export class Evaluator {
    constructor() {
        this.realm = new Realm();
        this.globalObject = new JSObject;
        this.globalObject.set('log', new JSObject);
        this.globalObject.get('log').call = args => {
            console.log(args);
        }
        this.ecs = [new ExecutionContext(this.realm,
            new ObjectEnvironmentRecord(this.globalObject),
            new ObjectEnvironmentRecord(this.globalObject))];
    }
    evaluateModule(node) {
        let globalEc = this.ecs[0];
        let newEC = new ExecutionContext(
            this.realm, 
            new EnvironmentRecord(globalEc.lexicalEnvironment),
            new EnvironmentRecord(globalEc.lexicalEnvironment)
        );
        this.ecs.puah(newEC);
        let reslut = this.evaluate(node);
        this.ecs.pop();
        return reslut;
    }
    evaluate(node) {
        if(this[node.type]) {
            let r = this[node.type](node)
            // console.log(r);
            return r;
        }
    }
    Program(node) {
        return this.evaluate(node.children[0])
    }
    StatementList(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0]);
        } else {
            let record =  this.evaluate(node.children[0]);
            if(record && record.type === 'normal') {
                return this.evaluate(node.children[1]);
            } else {
                return record;
            }
        }
    }
    Statement(node) {
        return this.evaluate(node.children[0])
    }
    FunctionDeclaration(node) {
        let name = node.children[1].name;
        let code = node.children[node.children.length -2];
        let func = new JSObject;
        func.call = args => {
            let newEC = new ExecutionContext(
                this.realm,
                new EnvironmentRecord(func.environment),
                new EnvironmentRecord(func.environment)
            );
            this.ecs.push(newEC);
            this.evaluate(code);
            this.ecs.pop();
        }
        let runningEC = this.ecs[this.ecs.length - 1];
        runningEC.lexicalEnvironment.add(name);
        runningEC.lexicalEnvironment.set(name, func);
        func.environment = runningEC.lexicalEnvironment;
        return new CompletionRecord();
        console.log(node);
    }
    Block(node) {
        if(node.children.length === 2) {
            return;
        }
        let runningEC = this.ecs[this.ecs.length-1];
        let newEC = new ExecutionContext(
            this.realm,
            new EnvironmentRecord(runningEC.lexicalEnvironment),
            runningEC.variableEnvironment
        );

        this.ecs.push(newEC);
        let reslut = this.evaluate(node.children[1]);
        this.ecs.pop(newEC);
        return reslut;
    }
    IfStatement(node) {
        let condition = this.evaluate(node.children[2]);
        if(condition instanceof Reference) {
            condition = condition.get();
        }
        if(condition.toBoolean().value) {
            return this.evaluate(node.children[4]);
        }
    }
    BreakStatement(node) {
        return new CompletionRecord(new JSUndefined, 'break');
    }
    ContinueStatement(node) {
        return new CompletionRecord(new JSUndefined, 'continue');
    }
    WhileStatement(node) {
        while(true) {
            let condition = this.evaluate(node.children[2]);
            if(condition instanceof Reference) {
                condition = condition.get();
            }
            if(condition.toBoolean().value) {
              let record = this.evaluate(node.children[4]);
              // completionRecort的类型
              if(record.type === 'continue') {
                  continue;
              } else if(record.type === 'break') {
                return new CompletionRecord(new JSUndefined, 'normal');
              }
            } else {
                return new CompletionRecord(new JSUndefined, 'normal');
            }
        }
    }
    VariableDeclaration(node) {
        let runningEC = this.ecs[this.ecs.length-1];
        runningEC.lexicalEnvironment.add(node.children[1].name);
        return new CompletionRecord(new JSUndefined, 'normal');
    }
    ExpressionStatement(node) {
        let reslut = this.evaluate(node.children[0]);
            if(reslut instanceof Reference)
                reslut = reslut.get();
        return new CompletionRecord(reslut, this.evaluate(node.children[0]));
    }
    Expression(node) {
        return this.evaluate(node.children[0])
    }
    AdditiveExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0])
        } else {
            let type = node.children[1].type;
           
            let left = this.evaluate(node.children[0]);
            let right = this.evaluate(node.children[2]);
            if (left instanceof Reference) {
                left = left.get();
            } 
            if (right instanceof Reference) {
                right = right.get();
            }
            if(type === '+') {
                return new JSNumber(left.value + right.value);
            } else if(type === '-') {
                return new JSNumber(left.value - right.value);
            }
        }
    }
    MultiplicativeExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0])
        } else {
            // todo
        }
    }
   
    PrimaryExpression(node) {
        return this.evaluate(node.children[0])
    }
    Literal(node) {
        return this.evaluate(node.children[0])
    }
    NumbericLiteral(node) {
        let str = node.value;
        let l = str.length;
        let value = 0;
        let n = 10;

        if(str.match(/^0b/)) {
            l -= 2;
            n = 2;
        } else if(str.match(/^0o/)) {
            l -= 2;
            n = 8;
        } else if(str.match(/^0x/)) {
            l -= 2;
            n = 16;
        }

        while(l--) {
            let s =  str.charCodeAt(str.length - l -1);
            if(s >= 'a'.charCodeAt(0)) {
                s -= 'a'.charCodeAt(0) + 10
            } else if(s >= 'A'.charCodeAt(0)) {
                s -= 'A'.charCodeAt(0) + 10
            } else if(s >= '0'.charCodeAt(0)) {
                s -= '0'.charCodeAt(0)
            }
            value = value * n + s
        }
        // console.log(value)
        return new JSNumber(value);
    }
    StringLiteral(node) {
        // console.log(node.value)
        let i = 1;
        let reslut = [];
        for(i = i; i < node.value.length-1; i++) {
            if(node.value[i] === '\\') {
                ++ i;
                let c = node.value[i];
                let map = {
                    "\"": "\"",
                    "\'": "\'",
                    "\\": "\\",
                    "b": String.fromCharCode(0x0008),
                    "f": String.fromCharCode(0x000C),
                    "n": String.fromCharCode(0x000A),
                    "r": String.fromCharCode(0x000D),
                    "v": String.fromCharCode(0x000B),
                    "t": String.fromCharCode(0x0009),
                }
                if(c in map) {
                    reslut.push(map[c])
                } else {
                    reslut.push(c)
                }

            } else {
                reslut.push(node.value[i])
            }
        }
        console.log(reslut)
        return new JSString(reslut);
    }
    BooleanLiteral(node) {
        if(node.value === 'false') 
            return new JSBoolean(false)
        else 
            return new JSBoolean(true)
    }
    ObjectLiteral(node) {
        if(node.children.length === 2) {
            return {};
        }
        if(node.children.length === 3) {
            let object = new JSObject();
            // object.prototype = ''
            this.PropertyList(node.children[1], object)
            return object;
        }
    }
    PropertyList(node, object) {
        if(node.children.length === 1) {
            this.Property(node.children[0], object)
        } else {
            this.PropertyList(node.children[0], object);
            this.Property(node.children[2], object);
        }
    }
    Property(node, object) {
        let name;
        if(node.children[0].type === "Identifier") {
            name = node.children[0].name;
        } else if(node.children[0].type === "StringLiteral") {
            name = (this.evaluate(node.children[0]));
        }
        object.set(name, {
            value: this.evaluate(node.children[2]),
            writable: true,
            enumerable: true,
            configable: true
        })
    }
    AssignmentExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0]);
        }
        let left = this.evaluate(node.children[0]);
        let right = this.evaluate(node.children[2]);

        left.set(right)
    }
    LogicalORExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0]);
        }
        let reslut = this.evaluate(node.children[0]);
        if(reslut) {
            return reslut;
        } else {
            return this.evaluate(node.children[2]);
        }
    }
    LogicalANDExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0]);
        }
        let reslut = this.evaluate(node.children[0]);
        if(!reslut) {
            return reslut;
        } else {
            return this.evaluate(node.children[2]);
        }
    }
    LeftHandSideExpression(node) {
        return this.evaluate(node.children[0])
    }
    NewExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0])
        }
        if(node.children.length === 2) {
            let cls = this.evaluate(node.children[1]);
            return cls.construct();
            /*let object = this.realm.Object.construct();
            let cls = this.evaluate(node.children[1]);
            let reslut = cls.call(object);
            if(reslut) {
                return reslut;
            } else {
                return object;
            }*/
        }
    }
    CallExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0])
        }
        if(node.children.length === 2) {
            let func = this.evaluate(node.children[0]);
            
            let args = this.evaluate(node.children[1]);
            if(func instanceof Reference) {
                func = func.get();
            }
            return func.call(args);
            /*let object = this.realm.Object.construct();
            let cls = this.evaluate(node.children[1]);
            let reslut = cls.call(object);
            if(reslut) {
                return reslut;
            } else {
                return object;
            }*/
        }
    }
    Arguments(node) {
        if(node.children.length === 2) 
            return [];
        else 
            return this.evaluate(node.children[1]);
    }
    ArgumentList(node) {
        if(node.children.length === 1) {
            let reslut = this.evaluate(node.children[0]);
            if(reslut instanceof Reference) {
                reslut = reslut.get();
            }
            return [reslut];
        } else {
            let reslut = this.evaluate(node.children[2]);
            if(reslut instanceof Reference) {
                reslut = reslut.get();
            }
            return this.evaluate(node.children[0]).concat(reslut);
        }
    }
    MemberExpression(node) {
        if(node.children.length === 1) {
            return this.evaluate(node.children[0])
        }
        if(node.children.length === 3) {
            let obj = this.evaluate(node.children[0]).get();
            let prop = obj.get(node.children[2].name);
            if("value" in prop) {
                return prop.value;
            }
            if("get" in prop) {
                return prop.get.call(obj);
            }
        }
    }
    
    Identifier(node) {
        let runningEC = this.ecs[this.ecs.length-1];
        return new Reference(
            runningEC.lexicalEnvironment,
            node.name
        );
    }
}

