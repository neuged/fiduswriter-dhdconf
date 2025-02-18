import download from "downloadjs"

import {ZipFileCreator} from "../tools/zip"

import {DhdConfHtmlExporter, DhdConfDocxExporter} from "../../dhdconf/exporter"
import {TEIExporter} from "../tei"

class HtmlExporterWithoutDownload extends DhdConfHtmlExporter {
    download(blob) {
        return blob
    }
}

class DocxExporterWithoutDownload extends DhdConfDocxExporter {
    download(blob) {
        return blob
    }
}

class TEIExporterWithoutDownload extends TEIExporter {
    download(blob) {
        return blob
    }
}

export async function exportDHC(doc, bibDB, imageDB, csl, updated, documentStyles, docxTemplateUrl) {

    const htmlExporter = new HtmlExporterWithoutDownload(
        doc,
        bibDB,
        imageDB,
        csl,
        updated,
        documentStyles
    )
    const docxExporter = new DocxExporterWithoutDownload(
        doc,
        docxTemplateUrl,
        bibDB,
        imageDB,
        csl
    )
    const teiExporter = new TEIExporterWithoutDownload(
        doc,
        bibDB,
        imageDB,
        csl,
        updated,
    )

    await htmlExporter.init()
    await teiExporter.init()
    const docxBlob = await docxExporter.init()

    const slug = teiExporter.slug
    const docxFile = {filename: `${slug}.docx`, contents: docxBlob}
    const htmlFile = htmlExporter.textFiles.find((i) => i.filename === "document.html")
    htmlFile.filename = `${slug}.html`

    const zipFile = new ZipFileCreator(
        [...htmlExporter.textFiles, ...teiExporter.textFiles, docxFile],
        [...htmlExporter.httpFiles, ...teiExporter.httpFiles],
        htmlExporter.includeZips,
        undefined,
        updated
    )
    zipFile.init().then(blob => {
        download(blob, `${teiExporter.slug}.dhc`, "application/zip")
    })
}
