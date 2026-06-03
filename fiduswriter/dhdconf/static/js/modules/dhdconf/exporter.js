import download from "downloadjs"

import {createSlug, createSlugLastName} from "../exporter/tools/file"

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
        const lastNameSlug = createSlugLastName(
            this.metaData.authors[0].attrs.lastname
        )
        const ownSlug = createSlug(this.docTitle)
        return download(
            blob,
            `${lastNameSlug}-${ownSlug}.html.zip`,
            this.mimeType
        )
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
        // console.log("los metadatos son: ", this.getBaseMetadata())
        const metadata = this.getBaseMetadata()
        const lastNameSlug = createSlugLastName(metadata.authors[0].lastname)
        const ownSlug = createSlug(this.docTitle)
        return download(blob, `${lastNameSlug}-${ownSlug}.docx`, this.mimeType)
    }
}
