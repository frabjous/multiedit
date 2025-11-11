// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////// proseditors.mjs /////////////////////////////
// Script for creaing ProseMirror WYWIWYG editors to include in //
// multieditors                                                 //
/////////////////////////////////////////////////////////////////

import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {Schema, DOMParser} from "prosemirror-model";
import {schema} from "prosemirror-schema-basic";
import {addListNodes} from "prosemirror-schema-list";
import {proseConfig} from "./proseconfig.mjs";
import symbolPicker from './symbol-picker.mjs';

// add lists and some extra marks
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks.append({
    "underline": {
      parseDOM: [{tag:"u"}, {style: 'text-decoration=underline'}, {class:'underline'}],
      toDOM() { return ["u",0]}
    },
    "superscript": {
      parseDOM: [{tag:"sup"}, {style: 'vertical-align=super'}, {class:'superscript'}],
      toDOM() { return ["sup",0]}
    },
    "subscript": {
      parseDOM: [{tag:"sub"}, {style: 'vertical-align=sub'}, {class:'superscript'}],
      toDOM() { return ["sub",0]}
    },
    "inlinemath": {
      parseDOM: [{tag:"span.math.inline"}],
      toDOM() { return ["span",{class:"math inline"},0]}
    },
    "displaymath": {
      parseDOM: [{tag:"span.math.display"}],
      toDOM() { return ["span",{class:"math display"},0]}
    }
  })
});

export default function getProseEditor(parent, contentid) {
  if (!parent) {
    console.error('No parent specified for prose editor.');
    return;
  }

  // if parent option passed as string, use as id
  // otherwise, assume to be DOM node
  let contentnode = contentid;
  if (typeof contentid == 'string') {
    contentnode = document.getElementById(contentid);
  }
  if (!contentnode) {
    console.error('No content node to mimic.')
    return;
  }

  const view = new EditorView(parent, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(contentnode),
      plugins: proseConfig({schema: mySchema})
    })
  });

  const btns = parent.getElementsByClassName("ProseMirror-menuitem");
  // add symbol picker button to menu
  if (btns.length >= 8) {
    const symbtn = document.createElement("span");
    symbtn.classList.add('ProseMirror-menuitem')
    const inner = document.createElement("span");
    symbtn.appendChild(inner);
    inner.title = 'Insert special character';
    const icospan = document.createElement("span");
    inner.appendChild(icospan);
    icospan.classList.add("material-symbols-outlined");
    icospan.style.position = 'relative';
    icospan.style.cursor = 'pointer';
    icospan.style.bottom = '-0.3rem';
    icospan.style.userSelect = 'none';
    icospan.innerHTML = 'special_character';
    inner.myview = view;
    btns[7].parentNode.insertBefore(symbtn, btns[7].nextSibling);
    inner.onclick= function() {
      const view = this.myview;
      symbolPicker(function(char) {
        const tr = view.state.tr;
        tr.insertText(char);
        const newstate = view.state.apply(tr);
        view.updateState(newstate);
      })
    }
  }
  const mbmb = parent.getElementsByClassName("ProseMirror-menubar");
  for (const mb of mbmb) {
    mb.style.minHeight = "0px";
  }
  return view;

}
