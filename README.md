
# multiedit

Javascript for creating simple multi-modal web editors that allow switching between WYSIWYG, markdown and HTML source editing modes.

Based on [ProseMirror](https://prosemirror.net/) and [CodeMirror](https://codemirror.net/).

## Installing

Clone this repository into a subdirectory of your webserver’s document root. E.g.,

```sh
cd /var/www/
git clone --depth 1 https://github.com/frabjous/multiedit.git
```

Use npm to install the dependencies and create a browser-loadable bundle.

```sh
cd multiedit
npm install
npm run bundle
```

Load the `multiedit.js` script in your document:

```html
<script charset="utf-8" src="/multiedit/multiedit.js"></script>
```

Create a multieditor using the `multieditor(..)` function (use `window.multieditor` in a module). Because the script loads other scripts, it is probably necessary to do so only after the window is fully loaded.

```javascript
window.addEventListener('load', () => {
    const me = multieditor({
        parent: document.body,
        mode: 'wysiwyg',
        content: '<p></p>'
    });
});
```
The `parent` argument can either be a DOM element, or, if a string is passed instead, an id of a DOM element. The editor will be placed inside this element.

The `mode` argument determines what mode the editor starts in, and should be one of `'wysiwyg'` for the ProseMirror WYSIWYG editing mode, `'md'` for the Markdown editing mode, or `'html'` for the HTML source editing mode.

The `content` argument determines the initial content of the editor, and should consist of HTML if either the `'wysiwyg'` or `'html'` editing modes are used to start, or of markdown if the `'md'` mode is used to start.

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

## License

LICENSE: GNU GPL v3 or later. You should have received a copy of the GNU General
Public License along with this program. If not, see
<https://www.gnu.org/licenses/gpl-3.0.html>.

© 2024 Kevin C. Klement. <klement@umass.edu>
