

import {HTMLExporter} from "../exporter/html2"
import {DocxExporter} from "../exporter/docx";
import {descendantNodes} from "../exporter/tools/doc_content"


export class DhdConfHtmlExporter extends HTMLExporter {
    init() {
        this.styleSheets.push({url: staticUrl("css/dhdconf_export_html.css")})
        return super.init()
    }
}

export class DhdConfDocxExporter extends DocxExporter {
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
