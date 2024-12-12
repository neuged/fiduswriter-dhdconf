import {DOMSerializer, DOMParser} from "prosemirror-model"

import {cslBibSchema} from "../../bibliography/schema/csl_bib"
import {FormatCitations} from "../../citations/format"
import {BIBLIOGRAPHY_HEADERS} from "../../schema/i18n"


export class TeiCitationsExporter {
    constructor(csl, bibDB, settings) {
        this.csl = csl
        this.bibDB = bibDB
        this.lang = settings.language
        this.citationStyleName = settings.citationstyle
        this.bibliographyHeader = settings.bibliography_header[this.lang] || BIBLIOGRAPHY_HEADERS[this.lang]
        this.fm = null
        this.parsedBibliography = null
    }

    async init(citationInfos) {
        const citationStyle = await this.csl.getStyle(this.citationStyleName)
        this.fm = new FormatCitations(
            this.csl,
            citationInfos,
            citationStyle,
            this.bibliographyHeader,
            this.bibDB,
            false,
            this.lang
        )
        await this.fm.init()
    }

    get citationTexts() {
        return this.fm?.citationTexts || []
    }

    get bibliography() {
        if (!this.parsedBibliography) {
            // parse the citeproc produced bibliography back into objects
            const bibNode = cslBibSchema.nodeFromJSON({type: "cslbib"})
            const cslSerializer = DOMSerializer.fromSchema(cslBibSchema)
            const dom = cslSerializer.serializeNode(bibNode)
            dom.innerHTML = this.fm.bibliography[1].join("")
            this.parsedBibliography = DOMParser.fromSchema(cslBibSchema).parse(dom, {topNode: bibNode}).toJSON()
        }
        return this.parsedBibliography
    }
}
