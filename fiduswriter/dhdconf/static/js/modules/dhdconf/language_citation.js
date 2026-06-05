// Theoretically we should put this file in modules/editor/state_plugins/
// But we would then overwrite the original plugins

// For explanation see:
// https://github.com/fiduswriter/fiduswriter/issues/1404
// https://prosemirror.net/docs/ref/

import {Plugin, PluginKey} from "prosemirror-state"

const key = new PluginKey("language_citation")

export const languageCitationSyncPlugin = () => {
    return new Plugin({
        key,
        appendTransaction(transactions, oldState, newState) {
            const oldLang = oldState.doc.attrs.language
            const newLang = newState.doc.attrs.language

            // Only react when the language attribute actually changes
            if (oldLang !== newLang) {
                let targetCitationStyle
                if (newLang === "en-US" || newLang === "en-GB") {
                    targetCitationStyle = "chicago-author-date"
                } else if (newLang === "de-DE") {
                    targetCitationStyle = "chicago-author-date-de"
                }

                // Check if the target differs from what's already in the new state
                const currentCitationStyle = newState.doc.attrs.citation_style
                if (
                    targetCitationStyle !== undefined &&
                    targetCitationStyle !== currentCitationStyle
                ) {
                    // Return a new transaction to update the attribute
                    return newState.tr.setDocAttribute(
                        "citationstyle",
                        targetCitationStyle
                    )
                }
            }

            // No changes needed
            return null
        }
    })
}
