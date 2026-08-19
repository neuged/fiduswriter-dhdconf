import "../exporter/html/patcher"
import download from "downloadjs"

import {authorSlug, titleSlug} from "../exporter/tools/slug"
import {HTMLExporter} from "../exporter/html"
import {DOCXExporter} from "../exporter/docx"
import {config} from "./config"

export class DhdConfHtmlExporter extends HTMLExporter {
    init() {
        this.styleSheets.push({url: staticUrl("css/dhdconf_export_html.css")})
        this.converterOptions.affiliationNumbering = "decimal"
        return super.init()
    }

    download(blob) {
        const author = authorSlug(this.metaData.authors[0].attrs)
        const title = titleSlug(this.docTitle)

        this.zipFileName = `${author}_${title}.${this.fileEnding}`
        return super.download(blob)
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

    download(blob) {
        const author = authorSlug(getBaseMetadata().authors[0])
        const title = titleSlug(this.docTitle)

        return download(blob, `${author}_${title}.docx`, this.mimeType)
    }
}
