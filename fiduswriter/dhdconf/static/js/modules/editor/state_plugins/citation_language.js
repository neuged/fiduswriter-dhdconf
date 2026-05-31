import {Plugin, PluginKey} from "prosemirror-state"

const key = new PluginKey("citationLanguage")

export const citationLanguagePlugin = options =>
    new Plugin({
        key,
        appendTransaction: (trs, oldState, newState) => {
            if (oldState.doc.attrs.language !== newState.doc.attrs.language) {
                let citationStyle

                switch (newState.doc.attrs.language) {
                    case "en-US":
                    case "en-GB":
                        citationStyle = "chicago-author-date"
                        break

                    case "de-DE":
                        citationStyle = "chicago-author-date-de"
                        break

                    default:
                        return null
                }

                if (citationStyle !== newState.doc.attrs.citation_style) {
                    return newState.tr
                        .setDocAttribute("citationstyle", citationStyle)
                }
            }

            return null
        }
    })
