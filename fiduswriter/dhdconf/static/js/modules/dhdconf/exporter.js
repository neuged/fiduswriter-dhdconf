import {HTMLExporter} from "../exporter/html"
import {DOCXExporter} from "../exporter/docx";
import {config} from "./config";


export class DhdConfHtmlExporter extends HTMLExporter {

    init() {
        this.styleSheets.push({url: staticUrl("css/dhdconf_export_html.css")})
        return super.init()
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
