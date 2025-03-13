import pretty from "pretty"

import {HTMLExporter} from "../exporter/html"
import {DOCXExporter} from "../exporter/docx";
import {descendantNodes} from "../exporter/tools/doc_content"


export class DhdConfHtmlExporter extends HTMLExporter {

    async process() {
        await super.process()
        await this.injectStyleSheetLink("css/dhdconf_export_html.css")
    }

    async injectStyleSheetLink(href) {
        // HACK (there is no this.styleSheets in fidus v4, we modify the html directly)
        await this.loadStyle({url: staticUrl("css/dhdconf_export_html.css")})
        const html = this.textFiles.find((i) => i.filename === this.contentFileName)
        if (html) {
            const idx = html.contents.indexOf("</head")
            if (idx) {
                html.contents = pretty([
                    html.contents.slice(0, idx),
                    `<link rel="stylesheet" type="text/css" href="${href}">`,
                    html.contents.slice(idx)
                ].join(""))
            }
        }
    }
}

export class DhdConfDocxExporter extends DOCXExporter {
    init() {
        this.doc = structuredClone(this.doc)
        // remove comments because users do not expect them to be in the submission
        this.removeCommentMarks(this.doc.content)
        // remove the orcid id tags, because for some reason the docx export doesn't
        // like them (TODO: Check if this is still needed in fiduswriter 4.0)
        this.removeOrcidIdTags(this.doc.content)
        return super.init()
    }

    removeCommentMarks(content) {
        descendantNodes(content).forEach(node => {
            if (node.marks) {
                node.marks = node.marks.filter(mark => mark.type !== "comment")
            }
        })
    }

    removeOrcidIdTags(content) {
        content.content = content.content.filter(node => node.attrs?.id !== "orcidIds")
    }
}
