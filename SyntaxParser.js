import {scan} from './LexParser.js';

let syntax = {
    Program: [["StatementList", 'EOF']],
    StatementList: [
        ["Statement"],
        ["StatementList", "Statement"]
    ],
    Statement: [
        ['ExpressionStatement'],
        ["IfStatement"],
        ["VariableDeclaration"],
        ["FunctionDeclaration"],
        ["WhileStatement"],
        ['Block'],
        ['BreakStatement'],
        ['ContinueStatement'],
        ['FunctionDeclaration'],
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
    ],
    BreakStatement: [
        ['break', ';']
    ],
    ContinueStatement: [
        ['continue', ';']
    ],
    Block: [
        ["{", "StatementList", "}"],
        ["{", "}"],
    ],
    IfStatement: [
        ["if", "(", "Expression", ")", "Statement"],
    ],
    WhileStatement: [
        ["while", "(", "Expression", ")", "Statement"],
    ],
    VariableDeclaration: [
        ['var', 'Identifier', ';'],
        ['let', 'Identifier', ';'],
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
    ],
    ExpressionStatement: [
        ["Expression", ";"]
    ],
    Expression: [
        ["AssignmentExpression"]
    ],
    AssignmentExpression: [
        ["LogicalORExpression"],
        ["LeftHandSideExpression", "=", "LogicalORExpression"],
    ],
    LogicalORExpression: [
        ["AdditiveExpression"],
        ["LogicalORExpression", "||", "AdditiveExpression"],
    ],
    LogicalANDExpression: [
        ["AdditiveExpression"],
        ["LogicalANDExpression", "&&", "AdditiveExpression"],
    ],
    AdditiveExpression: [
        ["MultiplicativeExpression"],
        ["AdditiveExpression", "+", "MultiplicativeExpression"],
        ["AdditiveExpression", "-", "MultiplicativeExpression"]
    ],
    MultiplicativeExpression: [
        ["LeftHandSideExpression"],
        ["MultiplicativeExpression", "*", "LeftHandSideExpression"],
        ["MultiplicativeExpression", "/", "LeftHandSideExpression"]
    ],
    LeftHandSideExpression: [
        ["NewExpression"],
        ["CallExpression"],
    ],
    CallExpression: [
        ["MemberExpression", "Arguments"],
        ["CallExpression", "Arguments"],
    ],
    Arguments: [
        ["(", ")"],
        ["(", "ArgumentList", ")"]
    ],
    ArgumentList: [
        ["AssignmentExpression"],
        ["ArgumentList", ",", "AssignmentExpression"],
    ],
    NewExpression: [
        ["MemberExpression"],
        ["new", "NewExpression"],
    ],
    MemberExpression: [
        ["PrimaryExpression"],
        ["PrimaryExpression", ".", "Identifier"],
        ["PrimaryExpression", "[", "Expression", "]"],
    ],
    PrimaryExpression: [
        ["(", "Expression", ")"],
        ["Literal"],
        ["Identifier"]
    ],
    Literal: [
        ["NumbericLiteral"],
        ["BooleanLiteral"],
        ["StringLiteral"],
        ["NullLiteral"],
        ["RegularExpressionLiteral"],
        ["ObjectLiteral"],
        ["ArrayLiteral"],
    ],
    ObjectLiteral: [
        ["{", "}"],
        ["{", "PropertyList", "}"]
    ],
    PropertyList: [
        ["Property"],
        ["PropertyList", ",", "Property"]
    ],
    Property: [
        ["StringLiteral", ":", "AdditiveExpression"],
        ["Identifier", ":", "AdditiveExpression"]
    ]
}

let hash = {
}

function closure(state) {
    hash[JSON.stringify(state)] = state;
    let queue = [];
    for(let symbol in state) {
        if(symbol.match(/^\$/)) {
            continue;
        }
        queue.push(symbol)
    }
    while(queue.length) {
        let symbol = queue.shift();

        if(syntax[symbol]) {
            for(let rule of syntax[symbol]) {
                if(!state[rule[0]]) {
                    queue.push(rule[0]);
                }
                let current = state;
                for(let part of rule) {
                    if(!current[part]) {
                        current[part] = {}
                    }
                    current = current[part]
                }
                current.$reduceType = symbol;
                current.$reduceLength = rule.length;
            }
        }
    }
    for(let symbol in state) {
        if(symbol.match(/^\$/)) {
            // return
            continue
        }
        if(hash[JSON.stringify(state[symbol])]) {
            state[symbol] = hash[JSON.stringify(state[symbol])];
        } else {
            closure(state[symbol])
        }
    }
}

let end ={
    $isEnd: true
}

let start = {
    "Program": end
}

closure(start)



// for(let element of scan(source)) {
//     console.log(element )
// }


export function parser(source) {
    let stack = [start]
    let symbolStack = [];

    function reduce() {
        let state = stack[stack.length-1]
        // console.log(state)
        if(state.$reduceType) {
            let children = [];
            for(let i = 0; i < state.$reduceLength; i++) {
                stack.pop();
                children.push(symbolStack.pop());
            }
            // state = state.$reduceState;
          return {
                type: state.$reduceType,
                children: children.reverse(),
            }
        } else {
            throw new Error('unexpected token')
        }
    }

    function shift(symbol) {
        let state = stack[stack.length-1]
        if(symbol.type in state) {
            stack.push(state[symbol.type]);
            symbolStack.push(symbol);
        } else {
            shift(reduce())
            shift(symbol)
        }
    }   
    for(let symbol of scan(source)) {
        shift(symbol)
        // console.log(symbol)
    }

    return reduce();
    // console.log(reduce())
    // console.log(stack)
}

