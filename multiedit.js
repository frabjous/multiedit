// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////////////////////////////////////////////////////
// This is the main script defining the command multieditor used  //
// to create a multieditor.                                       //
////////////////////////////////////////////////////////////////////

// add convenience functions if not already defined

if (!window?.byid) {
    window.byid = function(id) {
        return document.getElementById(id);
    }
}

if (!window?.addelem){
    window.addelem = function(opts) {
        if (!(opts?.tag)) { opts.tag = 'div'; }
        const e = document.createElement(opts.tag);
        if (opts.classes) {
            e.classList.add(...opts.classes);
        }
        // parent can either be set by an id, or by passing the
        // element itself
        if (opts?.parent) {
            if (typeof opts.parent === 'string') {
                const p = byid(opts.parent);
                if (p) { p.appendChild(e); }
            } else {
                opts.parent.appendChild(e);
            }
        }
        // asside from list of classes, parent, and tag, we
        // add everything else to object itself
        for (const o in opts) {
            if (o == 'tag' || o == 'parent' || o == 'classes') {
                continue;
            }
            e[o] = opts[o];
        }
        return e;
    }
}

if (!window.randomstring) {
    window.randomstring = function(n = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
            'abcdefghijklmnopqrstuvwxyz' +
            '0123456789';
        let rv = '';
        while (rv.length < n) {
            rv += chars[Math.floor(Math.random() * chars.length)];
        }
        return rv;
    }
}

if (!window.randomid) {
    window.randomid = function() {
        let id;
        do {
            id = randomstring(4);
        } while (byid(id));
        return id;
    }
}

// function for switching between modes
function applymode(mode) {
    if (!this.innerwrapper) {
        console.error('Cannot apply mode without a wrapper');
        return;
    }
    if (!this.tempholder) {
        console.error('Cannot apply mode without tempholder');
        return;
    }
    const oldmode = this?.shownmode ?? 'none';
    if (oldmode == mode) {
        return;
    }
    let currcontent = this.getcontent();

    // convert current content
    if (oldmode == 'md') {
        currcontent = markdown2html(currcontent);
    }
    if ((oldmode == 'html' || oldmode=='wysiwyg') && (mode == 'md')) {
        currcontent = html2markdown(currcontent);
    }

    // destroy old editor
    this.innerwrapper.innerHTML = '';
    // wysiwyg editor
    if (mode == 'wysiwyg') {
        this.tempholder.innerHTML = currcontent;
        this.currenteditor  = getProseEditor(
            this.innerwrapper, this.tempholder
        );
        this.shownmode = mode;
        return;
    }
    // markdown or html editor
    this.currenteditor = getEditor(
        this.innerwrapper, mode, currcontent
    );
    this.shownmode = mode;
}

function firstunescaped(s, r) {
    let res = s.search(r);
    if (res == -1) { return false; }
    if (res == 0) { return res; }
    if (s.at(res-1) != '\\') { return res; }
    return res + firstunescaped(s.substr(res + 1), r);
}

function gatherinfo() {
    const rv = {};
    rv.mode = this.getmode();
    rv.content = this.getcontent();
    if (rv.mode == 'md') {
        rv.html = markdown2html(rv.content);
    } else {
        rv.html = rv.content;
    }
    return rv;
}

function getcontent() {
    if (!this?.currenteditor || !this?.shownmode) {
        return (this?.startcontent ?? '');
    }
    if (this.shownmode == 'wysiwyg') {
        let rv = this?.currenteditor?.dom?.innerHTML ?? '';
        rv = rv.replaceAll('<br class="ProseMirror-trailingBreak">','')
            .replace(/<p>\s*<\/p>/g,'');
        return rv;
    }
    return this?.currenteditor?.state?.doc?.toString() ?? '';
}

function getmode() {
    if (this?.wysiwygradio?.checked) { return 'wysiwyg'; }
    if (this?.mdradio?.checked) { return 'md'; }
    if (this?.htmlradio?.checked) { return 'html'; }
    return null;
}

function html2markdown(h) {
    var turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        fence: '```',
        emDelimiter: '*'
    });
    turndownService.addRule('strikethrough', {
        filter: ['del','s','strike'],
        replacement: function (content) {
            return '~~' + content + '~~;'
        }
    });
    turndownService.addRule('subscript', {
        filter: ['sub','subscript'],
        replacement: function (content) {
            return '~' + content + '~';
        }
    });
    turndownService.addRule('superscript', {
        filter: ['sup','superscript'],
        replacement: function (content) {
            return '^' + content + '^';
        }
    });
    turndownService.addRule('softbreak', {
        filter: ['br'],
        replacement: function (content) {
            return '\\' + '\n';
        }
    });
    turndownService.addRule('inlinemath', {
        filter: function(node, options) {
            return ((node.classList.contains('math')) &&
                (node.classList.contains('inline')));
        },
        replacement: function (content) {
            return '$' + content + '$';
        }
    });
    turndownService.addRule('displaymath', {
        filter: function(node, options) {
            return ((node.classList.contains('math')) &&
                (node.classList.contains('display')));
        },
        replacement: function (content) {
            return '\n$$\n' + content + '\n$$\n';
        }
    });

    turndownService.keep(['script','style']);
    return turndownService.turndown(h).trim();

}

function loadCSS(url) {
    return addelem({
        parent: document.head,
        tag: 'link',
        rel: 'stylesheet',
        type: 'text/css',
        href: url
    });
}

function loadScript(url) {
    return addelem({
        parent: document.head,
        tag: 'script',
        src: url
    });
}

function markdown2html(m) {
    const md = markdownit({
      html: true,
      typographer: true
    }).use(markdownitSub).use(markdownitSup);
    let h = md.render(m);
    // convert display math
    h = pairreplace(h, '\\$\\$', '<span class="math display">', '</span>', 2);
    // convert inline math
    h = pairreplace(h, '\\$', '<span class="math inline">', '</span>', 1);
    return h;
}

// main function
function multieditor(opts) {
    // read or set mandagory properties
    if (!(opts?.parent)) {
        console.error('No parent specified for multieditor.');
        return;
    }
    let startmode = opts?.mode ?? 'wysiwyg';
    // create container element
    const me = addelem({
        tag: 'div',
        classes: ['multieditor'],
        parent: opts.parent
    });
    // hidden element to mimic
    me.tempholder = addelem({
        tag: 'div',
        parent: me
    });
    me.tempholder.style.display = 'none';
    const radioid = randomid();
    // create container for editors
    me.outerwrapper = addelem({
        tag: 'div',
        parent: me,
        classes: ['outerwrapper']
    });
    me.innerwrapper = addelem({
        tag: 'div',
        parent: me.outerwrapper,
        classes: ['innerwrapper']
    });
    // create switcher
    const switcherparent = addelem({
        tag: 'div',
        classes: ['pico'],
        parent: me
    });
    me.switcher = addelem({
        tag: 'fieldset',
        classes: ['pico'],
        parent: switcherparent,
        id: radioid
    });
    const legend = addelem({
        tag: 'span',
        classes: ['legend'],
        parent: me.switcher,
        innerHTML: 'Editing mode:'
    });
    me.wysiwygradio = addelem({
        tag: 'input',
        type: 'radio',
        parent: me.switcher,
        id: radioid + 'wysiwyg',
        checked: (startmode == 'wysiwyg'),
        name: radioid + 'radios',
        myme: me,
        onchange: function() { if (this.checked) {
            this.myme.applymode('wysiwyg');
        }}
    });
    const wlabel = addelem({
        tag: 'label',
        parent: me.switcher,
        htmlFor: radioid + 'wysiwyg',
        innerHTML: 'WYSIWYG'
    });
    me.mdradio = addelem({
        tag: 'input',
        type: 'radio',
        parent: me.switcher,
        id: radioid + 'md',
        checked: (startmode == 'md'),
        name: radioid + 'radios',
        myme: me,
        onchange: function() { if (this.checked) {
            this.myme.applymode('md');
        }}
    });
    const mlabel = addelem({
        tag: 'label',
        parent: me.switcher,
        htmlFor: radioid + 'md',
        innerHTML: 'Markdown'
    });
    me.htmlradio = addelem({
        tag: 'input',
        type: 'radio',
        parent: me.switcher,
        id: radioid + 'html',
        checked: (startmode == 'html'),
        name: radioid + 'radios',
        myme: me,
        onchange: function() { if (this.checked) {
            this.myme.applymode('html');
        }}
    });
    const hlabel = addelem({
        tag: 'label',
        parent: me.switcher,
        htmlFor: radioid + 'html',
        innerHTML: 'HTML source'
    });
    // assign functions to "this"
    me.applymode = applymode;
    me.gatherinfo = gatherinfo;
    me.getcontent = getcontent;
    me.getmode = getmode;
    me.startcontent = opts?.content ?? '';
    // apply original mode
    me.applymode(startmode);
    return me;
}

function pairreplaceOnce(str, m, l, r, len) {
    const pr = unescapedpair(str, m, len);
    if (!pr) { return str; }
    return str.substring(0, pr[0]) + l + str.substring(pr[0] + len,
        pr[1]) + r + str.substring(pr[1] + len);
}

function pairreplace(str, m, l, r, len) {
    let newval = str;
    let oldval;
    do {
        oldval = newval;
        newval = pairreplaceOnce(oldval, m, l, r, len);
    } while (newval != oldval);
    return newval;
}

function unescapedpair(s,r,len) {
    const first = firstunescaped(s,r);
    if (!first) { return false; }
    let second = firstunescaped(s.substr(first + len),r);
    if (!second) { return false; }
    second = first+second+len;
    return [first, second];
}

// load other needed resources
loadCSS('/multiedit/multiedit.css');
loadScript("/multiedit/editor-bundle.js");
loadScript("https://unpkg.com/turndown/dist/turndown.js");
loadScript("https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js");
loadScript("https://cdn.jsdelivr.net/npm/markdown-it-sub/dist/markdown-it-sub.min.js");
loadScript("https://cdn.jsdelivr.net/npm/markdown-it-sup/dist/markdown-it-sup.min.js");
