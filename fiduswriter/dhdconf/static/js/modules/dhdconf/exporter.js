import pretty from "pretty"

import {HTMLExporter} from "../exporter/html"
import {DOCXExporter} from "../exporter/docx";
import {descendantNodes} from "../exporter/tools/doc_content"
import {config} from "./config";


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
        if (config.docxRemoveComments) {
            this.doc = structuredClone(this.doc)
            this.doc.comments = {}
        }
        return super.init()
    }
}
