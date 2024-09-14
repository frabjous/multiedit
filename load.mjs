
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////////////////////////////////////////////////////////
// This module loads the javascript needed to create plaintext      //
// and prose editors and makes them available to other scripts.     //
// running in the browser.                                          //
// This should not be loaded into a document directly, but through  //
// editor-bundle.js.                                                //
//////////////////////////////////////////////////////////////////////

import getEditor from './plaineditors.mjs';
import getProseEditor from './proseeditors.mjs';

window.getEditor = getEditor;
window.getProseEditor = getProseEditor;
