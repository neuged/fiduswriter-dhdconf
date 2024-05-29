import download from "downloadjs"

import {createSlug} from "../tools/file"
import {removeHidden} from "../tools/doc_content"
import {ZipFileCreator} from "../tools/zip"

import convert from './convert'
import {extractImageIDs} from './extract'


/*
 * Export a document as TEI XML.
 */
export function exportTEI(doc, bibDB, imageDB, csl) {
    const slug = createSlug(doc.title)
    const fileName = `${slug}.tei.xml`
    const docContent = removeHidden(doc.content)
    //console.log(docContent)
    console.log(bibDB)
    console.log(csl)

    const enc = new TextEncoder()
    const tei = enc.encode(convert(slug, docContent, bibDB, imageDB))

    const images = extractImageIDs(docContent, imageDB)
    const files = images.map(id => {
        const entry = imageDB.db[id]
        return {
            filename: entry.image.split('/').pop(),
            url: entry.image
        }
    })

    const zipFile = new ZipFileCreator(
        [{filename: fileName, contents: tei}],      // text files
        files,                                      // binary files
        undefined,                                  // zip files
        undefined,                                  // mime type
        new Date()                                  // update date
    )
    zipFile.init().then(blob => {
        download(blob, `${slug}.dhc`, 'application/zip')
    })
}
