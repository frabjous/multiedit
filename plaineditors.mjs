// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// plaineitors.mjs ///////////////////////////////
// For creating codemirror plain text editor widgets                 //
////////////////////////////////////////////////////////////////////////

//
// Modules
//
import {indentUnit, syntaxHighlighting, HighlightStyle} from '@codemirror/language';
import {EditorView, basicSetup} from "codemirror";
import {tags as t} from "@lezer/highlight" //~/http/tmp/multiedit/node_modules/@ddietr/codemirror-themes/dist/theme
import {githubLight as ctheme} from '@ddietr/codemirror-themes/github-light.js';
import {
    cursorLineBoundaryBackward,
    copyLineDown,
    cursorCharLeft,
    cursorCharRight,
    cursorLineDown,
    cursorLineUp,
    cursorMatchingBracket,
    deleteLine,
    deleteToLineEnd,
    deleteToLineStart,
    indentLess,
    indentMore,
    indentSelection,
    indentWithTab,
    insertBlankLine,
    insertNewlineAndIndent,
    toggleComment } from "@codemirror/commands"
import {EditorState, StateEffect} from "@codemirror/state";
import {keymap} from "@codemirror/view";

// languages
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {html} from '@codemirror/lang-html';

// new commands for keymap
const saveCmd = function(view) {
    if (view.save) { view.save(); }
}

const insertBlankLineUp = function(view) {
    cursorLineBoundaryBackward(view);
    insertNewlineAndIndent(view);
    cursorCharLeft(view);
}

const smartDeleteLine = function(view) {
    // determine whether something is selected
    let smthgsel = view.state.selection.ranges.some(r => !r.empty);
    // if not, delete the line
    if (!smthgsel) {
        if (window.navigator?.clipboard) {
            let fr = view.state.selection.main.head;
            let txt = view.state.doc.lineAt(fr).text.toString();
            window.navigator.clipboard.writeText(txt + "\n");
        }
        deleteLine(view);
        return true;
    }
    // by returning false we pass on to next binding
    return false;
}

const joinLines = function(view) {
    let smthgsel = view.state.selection.ranges.some(r => !r.empty);
    let fr = 0;
    let to = 0;
    if (smthgsel) {
        // if something selected, that determines range
        fr = view.state.selection.main.from;
        to = view.state.selection.main.to;
    } else {
        // otherwise, take current line
        let cpos = view?.state?.selection?.main?.anchor ?? 0;
        const stline = view.state.doc.lineAt(cpos);
        const stlinenum = stline.number;
        const nextline = view.state.doc.line(stlinenum+1);
        if (!nextline) { return; }
        fr = stline.from;
        to = nextline.to;
    }
    let stuff = view.state.sliceDoc(fr, to);
    let newstuff = stuff.replace(/\s*\n\s*/g,' ');
    view.dispatch(view.state.update({
        changes: {
            from: fr,
            to: to,
            insert: newstuff
        }
    }));
    return true;
}

const additionalKeymap = [
    { key: "Ctrl-d", run: copyLineDown, preventDefault: true },
    { key: "Ctrl-j", run: joinLines, preventDefault: true },
    { key: "Ctrl-k", run: deleteToLineEnd, preventDefault: true },
    { key: "Ctrl-x", run: smartDeleteLine },
    { key: "Ctrl-u", run: deleteToLineStart, preventDefault: true },
    { key: "Alt-5", run: cursorMatchingBracket, preventDefault: true },
    { key: "Alt-,", run: indentLess, preventDefault: true },
    { key: "Ctrl-,", run: indentLess, preventDefault: true },
    { key: "Alt-<", run: indentLess, preventDefault: true },
    { key: "Ctrl-<", run: indentLess, preventDefault: true },
    { key: "Alt-.", run: indentMore, preventDefault: true },
    { key: "Ctrl-.", run: indentMore, preventDefault: true },
    { key: "Alt->", run: indentMore, preventDefault: true },
    { key: "Ctrl->", run: indentMore, preventDefault: true },
    { key: "Ctrl-s", run: saveCmd, preventDefault: true },
    { key: "Shift-Tab", run: indentSelection, preventDefault: true },
    { key: "Alt-Shift-Tab", run: indentSelection, preventDefault: true },
    { key: "Alt-Tab", run: indentSelection, preventDefault: true },
    { key: "Ctrl-ArrowUp", run: insertBlankLineUp, preventDefault: true },
    { key: "Ctrl-ArrowDown", run: insertBlankLine, preventDefault: true }
]


let extensions = [
    keymap.of(additionalKeymap),
    indentUnit.of('    '),
    keymap.of([indentWithTab]),
    EditorView.lineWrapping,
    basicSetup,
    ctheme
];

export default function getEditor(parentnode, fileextension = 'html', contents = '') {
    if (!parentnode) {
        console.error('No parent specified for editor.');
        return null;
    }
    const langexts = [];
    if (fileextension == 'md' || fileextension == 'markdown') {
        langexts.push(markdown({base: markdownLanguage}));
    }
    if (fileextension == 'html') {
        langexts.push(html());
    }
    const editor = new EditorView({
        doc: contents,
        extensions: [extensions, langexts],
        parent: parentnode
    });

    return editor;
}
