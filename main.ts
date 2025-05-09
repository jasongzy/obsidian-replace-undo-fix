import { Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { EditorSelection, TransactionSpec, Transaction } from '@codemirror/state';

// Includes full-width ASCII (U+FF01-U+FF5E), CJK symbols and punctuation (U+3000-U+303F),
// and other effected characters.
const PROBLEMATIC_CHARS_REGEX = /[\uFF01-\uFF5E\u3000-\u303F\u2000-\u206F\u00B7\uFFE5]/;

// Specific two-character sequences that are input at once by some IMEs.
const DOUBLE_ELLIPSIS = "\u2026\u2026"; // ……
const DOUBLE_EM_DASH = "\u2014\u2014";   // ——

export default class ReplaceUndoFixPlugin extends Plugin {
    async onload() {
        // console.log('Loading Replace Undo Fix Plugin');

        this.registerEditorExtension(EditorView.inputHandler.of(
            (view: EditorView, from: number, to: number, text: string, _insert: () => Transaction): boolean => {

                const isReplacingSelection = from !== to;
                let shoudHandleInput = false;

                if (text.length === 1 && PROBLEMATIC_CHARS_REGEX.test(text)) {
                    shoudHandleInput = true;
                    // console.log(`InputHandler: Detected single problematic char [${text}] replacing selection from ${from} to ${to}.`);
                } else if (text === DOUBLE_ELLIPSIS || text === DOUBLE_EM_DASH) {
                    shoudHandleInput = true;
                    // console.log(`InputHandler: Detected double char sequence [${text}] replacing selection from ${from} to ${to}.`);
                }

                if (shoudHandleInput && isReplacingSelection) {
                    const transactionSpec: TransactionSpec = {
                        changes: { from, to, insert: text },
                        selection: EditorSelection.cursor(from + text.length), // Place cursor after the inserted text
                        userEvent: 'input.replace', // Mark as a user-initiated replacement for undo history
                        scrollIntoView: true
                    };

                    view.dispatch(view.state.update(transactionSpec));

                    // Return true to indicate that this input has been handled,
                    // preventing default behavior and other handlers.
                    return true;
                }

                // If conditions are not met, let other handlers or default behavior process the input.
                return false;
            }
        ));

        // console.log('Replace Undo Fix Plugin loaded');
    }

    onunload() {
        // console.log('Unloading Replace Undo Fix Plugin');
    }
}
