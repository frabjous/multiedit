
# multiedit

Javascript module for creating simple multi-modal web editors that allow switching between WYSIWYG, markdown and HTML source editing modes.

Based on [ProseMirror](https://prosemirror.net/) and [CodeMirror](https://codemirror.net/).

## Installing

Clone this repository into a subdirectory of your webserver’s document root. E.g.,

```sh
cd /var/www/
git clone --depth 1 https://github.com/frabjous/multiedit.git
```

Use npm to install the dependencies, and create a browser-loadable bundle.

```sh
cd multiedit
npm install
npm run build
```

The last command should create a file `multieditor.mjs`.

Load the `multieditor.mjs` script in your document through a module script tag, and create an editor using the `multieditor(..)` function.

```html
<script type="module">
import multieditor from "./multiedit/multieditor.mjs";
const me = multieditor({
    parent: document.body,
    mode: 'wysiwyg',
    content: '<p></p>'
});
</script>
```

The `parent` argument can either be a DOM element, or, if a string is passed instead, an id of a DOM element. The editor will be placed inside this element.

The `mode` argument determines what mode the editor starts in, and should be one of `'wysiwyg'` for the ProseMirror WYSIWYG editing mode, `'md'` for the Markdown editing mode, or `'html'` for the HTML source editing mode.

The `content` argument determines the initial content of the editor, and should consist of HTML if either the `'wysiwyg'` or `'html'` editing modes are used at the start, or of markdown if the `'md'` mode is used at the start.

The modes can be switched between each other using the radio buttons at the bottom.

The current state and contents of the editor can be determined with the `gatherinfo()` method.

```javascript
const info = me.gatherinfo();
```

This returns an object with three properties:

```json
{
    "mode": "⟨current mode: 'wysiwyg'|'md'|'html'⟩",
    "content": "⟨editor content, either html or md depending on mode⟩",
    "html": "⟨the markdown converted to html in md mode⟩"
}
```

Note also that when the script is loaded it also assigns the `multieditor(..)` function to the global `window` object as well, so it can be called outside of a module so long as the module is already loaded.

## License

LICENSE: GNU GPL v3 or later. You should have received a copy of the GNU General
Public License along with this program. If not, see
<https://www.gnu.org/licenses/gpl-3.0.html>.

© 2024 Kevin C. Klement. <klement@umass.edu>
