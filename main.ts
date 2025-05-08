import { EditorSelection, Transaction, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Plugin } from 'obsidian';

// Regular expression to detect common full-width characters.
// Includes full-width ASCII, CJK symbols, and punctuation.
const FULL_WIDTH_CHARS_REGEX = /[\uFF01-\uFF5E\u3000-\u303F]/;

export default class FullWidthUndoFixPlugin extends Plugin {
    async onload() {
        // console.log('Loading Replace Undo Fix Plugin');

        this.registerEditorExtension(EditorView.inputHandler.of(
            (view: EditorView, from: number, to: number, text: string, _insert: () => Transaction): boolean => {
                // Check if:
                // 1. A single character is being inserted.
                // 2. The character is a full-width character.
                // 3. There is an active selection being replaced (from !== to).
                const isSingleChar = text.length === 1;
                const isFullWidthChar = FULL_WIDTH_CHARS_REGEX.test(text);
                const isReplacingSelection = from !== to;

                if (isSingleChar && isFullWidthChar && isReplacingSelection) {
                    // console.log(`InputHandler: Detected full-width char [${text}] replacing selection from ${from} to ${to}.`);

                    const transactionSpec: TransactionSpec = {
                        changes: { from, to, insert: text },
                        selection: EditorSelection.cursor(from + text.length), // Place cursor after the inserted character
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
