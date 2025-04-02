import download from "downloadjs"

import {createSlug} from "../tools/file"
import {removeHidden} from "../tools/doc_content"
import {ZipFileCreator} from "../tools/zip"

import convert from "./convert"
import {extractBody, extractCitations, extractImageIDs} from "./extract"
import {TeiCitationsExporter} from "./citations"
import {TeiExporterMath} from "./math"

export class TEIExporter {
    constructor(doc, bibDB, imageDB, csl, updated, settings={}) {
        this.doc = doc
        this.bibDB = bibDB
        this.imageDB = imageDB
        this.csl = csl
        this.updated = updated

        this.slug = createSlug(doc.title)
        this.citeExp = new TeiCitationsExporter(csl, bibDB, doc.settings)
        this.mathExp = new TeiExporterMath()

        this.settings = settings

        this.docContent = false
        this.textFiles = []
        this.httpFiles = []
    }

    init() {
        return this.process().then(
            () => this.createZip()
        )
    }

    async process() {
        this.docContent = removeHidden(this.doc.content)

        await this.citeExp.init(extractCitations(extractBody(this.docContent)))
        await this.mathExp.init()

        const enc = new TextEncoder()
        const tei = enc.encode(convert(
            this.slug,
            this.docContent,
            this.imageDB,
            this.citeExp,
            this.mathExp,
            this.settings
        ))
        this.textFiles = [{filename: `${this.slug}.tei.xml`, contents: tei}]

        const images = extractImageIDs(this.docContent, this.imageDB)
        this.httpFiles = images.map(id => {
            const entry = this.imageDB.db[id]
            return {
                filename: `images/${entry.image.split("/").pop()}`,
                url: entry.image
            }
        })
    }

    createZip() {
        const zipper = new ZipFileCreator(
            this.textFiles,
            this.httpFiles,
            undefined,
            undefined,
            this.updated
        )
        return zipper.init().then(
            blob => this.download(blob)
        )
    }

    download(blob) {
        return download(blob, `${this.slug}.tei.xml.zip`, "application/zip")
    }
}
