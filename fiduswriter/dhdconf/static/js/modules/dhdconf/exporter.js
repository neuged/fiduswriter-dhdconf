

import {HTMLExporter} from "../exporter/html2"
import {DocxExporter} from "../exporter/docx";
import {descendantNodes} from "../exporter/tools/doc_content"


export class DhdConfHtmlExporter extends HTMLExporter {
    init() {
        this.styleSheets.push({url: staticUrl("css/dhdconf_export_html.css")})
        return super.init()
    }
}

export class NoCommentsDocxExporter extends DocxExporter {

    init() {
        this.doc = structuredClone(this.doc)
        this.removeCommentMarks(this.doc.content)
        return super.init()
    }

    removeCommentMarks(content) {
        descendantNodes(content).forEach(node => {
            if (node.marks) {
                node.marks = node.marks.filter(mark => mark.type !== "comment")
            }
        })
    }
}
