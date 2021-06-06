import {Evaluator} from './evaluator.js';
import {parser} from './SyntaxParser.js';


document.getElementById('run').addEventListener('click', () => {
    let r = new Evaluator().evaluate(parser(document.getElementById('source').value));
    console.log(r);
})