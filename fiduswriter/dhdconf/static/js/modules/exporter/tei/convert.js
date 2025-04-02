/**
 * All functions in this module take a blob of data and return a string of TEI XML markup.
 *
 * @module
 */

import {textContent} from "../tools/doc_content"
import extract, {extractTextNodes} from "./extract"
import {tag, wrap, wrapText, linkify, linkRef, escapeXmlText} from "./utils"
import {header} from "./templates/header"
import {body} from "./templates/body"
import {back} from "./templates/back"
import {TEITemplate} from "./templates"


function authors(data, orcidIds) {
    return data.map(({firstname, lastname, institution, email}, idx) => {
        const name = wrap(
            "persName",
            `${wrapText("surname", lastname)}${wrapText("forename", firstname)}`
        )
        const inst = wrapText("affiliation", institution || "")
        const mail = wrapText("email", email || "")

        const contents = [name, inst, mail]
        if (idx < orcidIds.length && orcidIds[idx]) {
            contents.push(wrapText("idno", orcidIds[idx], {type: "ORCID"}))
        }
        return wrap("author", contents.join(""))
    }).join("\n")
}

function keywords(data, n="keywords") {
    if (data.length) {
        const kws = data.map(kw => wrapText("term", kw)).join("\n")
        return wrap("keywords", kws, {scheme: "ConfTool", n: n})
    }
    return ""
}

/**
 * Parse a leaf element of docContents, i.e. an element with type 'text' and
 * (optionally) some marks for emhasis.
 */
function text(item) {
    if (item.marks && item.marks.length) {
        return item.marks.reduce((previous, current) => {
            if (current.type === "em") {
                return wrap("hi", previous, {rend: "italic"})
            } else if (current.type === "strong") {
                return wrap("hi", previous, {rend: "bold"})
            } else if (current.type === "link" && current.attrs.href) {
                if (current.attrs.href.startsWith("#")) {
                    return previous  // do not show internal links
                }
                return linkRef(current.attrs.href, previous)
            }
            return previous
        }, escapeXmlText(item.text))
    }
    return escapeXmlText(item.text)
}

/**
 * Build two strings of TEI from the 'richtext' part of a document.
 * The first string represents the content and the second any footnotes.
 */
function richText(richTextContent, imgDB, citationTexts, mathExporter) {
    let divLevel = 0    // the number of currently open divs
    let fnCount = 0     // the number of footnotes we have encountered
    let figCount = 0    // the number of figures we have encountered
    let citeCount = 0   // the number of citations we have encountered
    const footnotesTEI = []

    function f(item) {
        /* This is a base case because we have arrived at a leaf node. */
        if (item.type === "text") {
            return text(item)
        }

        if (item.type === "equation" && item.attrs?.equation) {
            return wrap("formula",
                mathExporter.latexToMathML(item.attrs.equation)
            )
        }

        /* Another base case, since the actual content of the footnote
         * is only needed at the bottom of the text. */
        if (item.type === "footnote") {
            fnCount += 1
            footnotesTEI.push(wrap(
                "note",
                item.attrs.footnote.map(c => f(c)).join(""),
                {n: fnCount, rend: "footnote text", "xml:id": `ftn${fnCount}`}
            ))
            // Return only the markup for footnotes inside the regular text.
            return tag("ref", {n: fnCount, target: `ftn${fnCount}`})
        }

        /* Various recursive cases which require further parsing. */

        /* This also handles image elements */
        if (item.type === "figure") {
            figCount++
            /* image is only an ID which we still need to look up in the imgDB */
            const image = item.content.find(i => i.type === "image")?.attrs.image
            const filename = imgDB.db[image]?.image.split("/").pop()
            const caption = item.attrs.caption
                ? item.content.find(i => i.type === "figure_caption").content?.map(c => f(c)).join("")
                : null
            return wrap("figure",
                tag("graphic", {url: `images/${filename}`})
                + wrap("head", `Abbildung ${figCount}${caption ? ": " : ""}${caption || ""}`)
            )
        }

        if (item.type === "image") {
            /* Do nothing, as images are handled when we encounter a figure node. */
            return ""
        }

        /* Handle table nodes and all their contents */
        if (item.type === "table") {
            let caption = ""
            if (item.attrs.caption) {
                const captionTEI = item.content.find(it => it.type === "table_caption").content
                    .map(it => f(it)).join("")
                caption = wrap("head", captionTEI)
            }
            const tableBody = item.content.find(it => it.type === "table_body").content
            const tableTEI = tableBody.map(row => {
                const rowTEI = row.content.map(it => {
                    if (it.type === "table_header") {
                        return wrap("cell", it.content.map(c => f(c)).join(""), {role: "label"})
                    } else if (it.type === "table_cell") {
                        return wrap("cell", it.content.map(c => f(c)).join(""))
                    }
                    return ""
                }).join("")
                const isLabel = row.content.filter(c => c.type === "table_header").length === row.content.length
                return isLabel ? wrap("row", rowTEI, {role: "label"}) : wrap("row", rowTEI)
            }).join("")
            return wrap("table", caption + tableTEI)
        }

        if (item.type.startsWith("table_")) {
            /* Do nothing, it gets handled by table elements */
            return ""
        }

        if (item.type === "blockquote") {
            return wrap("quote", item.content.map(c => f(c)).join(""))
        }

        if (item.type === "code_block") {
            return wrapText("code", textContent(item))
        }

        if (item.type === "ordered_list") {
            const items = item.content.filter(c => c.type === "list_item")
                .map(li => {
                    const liTEI = li.content.map(ic => f(ic)).join("")
                    return wrap("item", liTEI)
                })
                .join("")
            // Note that earlier versions of the TEI guidelines recommended
            // <list type="numbered"> instead.
            return wrap("list", items, {rend: "ordered"})
        }
        if (item.type === "bullet_list") {
            const items = item.content.filter(c => c.type === "list_item")
                .map(li => {
                    const liTEI = li.content.map(ic => f(ic)).join("")
                    return wrap("item", liTEI)
                })
                .join("")
            // Note that earlier versions of the TEI guidelines recommended
            // <list type="bulleted"> instead.
            return wrap("list", items, {rend: "bulleted"})
        }
        if (item.type === "list_item") {
            // Do nothing, already handled in 'bullet_list' or 'ordered_list'.
            return ""
        }

        if (item.type === "paragraph") {
            if (item.content === undefined) {
                return tag("lb")
            }
            return wrap("p", item.content.map(c => f(c)).join(""))
        }

        if (item.type.startsWith("heading")) {
            const order = parseInt(item.type.slice(-1))
            // Whenever the new heading is of a higher order (i.e. the number is smaller)
            // or the same as the preceding heading, we need to close our previous div(s).
            const closing = (order <= divLevel) ? "</div>".repeat(divLevel + 1 - order) : ""
            divLevel = order
            const opening = "<div rend=\"DH-Heading\">"
            const head = wrap("head", item.content.map(c => f(c)).join(""))
            return `${closing}${opening}${head}`
        }

        if (item.type === "cross_reference") {
            return item.attrs.title
        }

        if (item.type === "citation") {
            return citationTexts[citeCount++]
        }

        return ""
    }

    const result = richTextContent.map(c => f(c)).join("")
    const closing = "</div>".repeat(divLevel)
    const body = `${result}${closing}`

    const footnotes = footnotesTEI.length
        ? wrap("div", footnotesTEI.join("\n"), {type: "notes"})
        : ""
    return [body, footnotes]
}

function bibliography(bibliography) {
    const tei = bibliography?.content?.map((item) => {
        return wrap("bibl", extractTextNodes(item).map(n => linkify(text(n))).join(""))
    }).join("\n")
    return tei || ""
}


/**
 * This is the main entry point of this module. It takes the title-slug of
 * the document and the documents content object and generates a string
 * of TEI XML suitable for download.
 */
function convert(slug, docContents, imgDB, citationsExporter, mathExporter, settings) {
    const fields = extract(docContents)

    // All the fields used in the TEI header:
    const authorsTEI = authors(fields.authors, fields.orcidIds)
    const date = fields.date
    const keywordsTEI = [
        keywords(["Paper"], "category"),
        keywords(fields.tags.contributionTypes, "subcategory"),
        keywords(fields.tags.keywords, "keywords"),
        keywords(fields.tags.topics, "topics"),
    ].join("\n")
    const title = wrapText("title", fields.title, {type: "main"})
    const subtitle = wrapText("title", fields.subtitle, {type: "sub"})

    const [abstract,] = richText(fields.abstract.content)

    const TEIheader = header(
        authorsTEI,
        title,
        date,
        keywordsTEI,
        subtitle,
        abstract,
        settings.publicationStmt
    )

    // All the fields used in the TEI body:
    const [text, footnotes] = richText(
        fields.body.content,
        imgDB,
        citationsExporter.citationTexts,
        mathExporter
    )
    const TEIbody = body(text)

    // All the fields used in the TEI back:
    const bibItems = bibliography(citationsExporter.bibliography)
    const TEIback = back(footnotes, citationsExporter.bibliographyHeader, bibItems)

    return TEITemplate(slug, TEIheader, TEIbody, TEIback)
}

export {authors, keywords, richText, text}
export default convert
