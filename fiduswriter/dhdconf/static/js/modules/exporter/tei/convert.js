// import {escapeText} from "../../common"
// import {FIG_CATS} from "../../schema/i18n"

/**
 * All functions in this module take a blob of data and return a string of TEI XML markup.
 *
 * @module
 */

import extract from "./extract"
import {tag, wrap} from "./utils"
import {header} from "./templates/header"
import {body} from "./templates/body"
import {back} from "./templates/back"
import {TEITemplate} from "./templates"
import bibliography from "./bibliography"


function authors(data) {
    const tei = data.map(({firstname, lastname, institution, email}) => {
        const name = wrap('name', `${wrap('surname', lastname)}${wrap('forename', firstname)}`)
        const inst = wrap('affiliation', institution)
        email = wrap('email', email)
        return wrap('author', `${name}${inst}${email}`)
    }).join('\n')
    return tei
}

function keywords(data) {
    if (data.length) {
        const kws = data.map(kw => wrap('term', kw)).join('\n')
        return wrap('keywords', kws, {n: 'keywords', scheme: 'ConfTool'})
    }
    return ''
}

/**
 * Parse a leaf element of docContents, i.e. an element with type 'text' and
 * (optionally) some marks for emhasis.
 */
function text(item) {
    if (item.marks && item.marks.length) {
        const result = item.marks.reduce((previous, current) => {
            if (current.type === 'em') {
                return wrap('hi', previous, {rend: 'italic'})
            } else if (current.type === 'strong') {
                return wrap('hi', previous, {rend: 'bold'})
            }
            return previous
        }, item.text)
        return result
    }
    return item.text
}

/**
 * Build a string of TEI from the content of a part of docContents
 * with type 'richtext'.
 */
function richText(richTextContent, imgDB) {
    let divLevel = 0    // the number of currently open divs
    let fnCount = 0     // the number of footnotes we have encountered
    let figCount = 0  // the number of figures we have encountered

    function f(item) {
        /* This is a base case because we have arrived at a leaf node. */
        if (item.type === 'text') {
            return text(item)
        }
        if (item.type === 'equation') {
            return wrap('formula', `$${item.attrs.equation}$`, {notation: 'tex'})
        }

        /* Another base case, since the actual content of the footnote
         * is only needed at the bottom of the text. */
        if (item.type === 'footnote') {
            // This only handles the markup for footnotes inside the
            // regular text. The actual footnotes have to be generated
            // separately and placed at the bottom of the text.
            fnCount++
            return tag('ref', {n: fnCount, target: `ftn${fnCount}`})
        }

        /* Various recursive cases which require further parsing. */

        /* This also handles image elements */
        if (item.type === 'figure') {
            figCount++
            /* image is only an ID which we still need to look up in the imgDB */
            const image = item.content.find(i => i.type === 'image')?.attrs.image
            const filename = imgDB.db[image]?.image.split('/').pop()
            const caption = item.attrs.caption
                ? item.content.find(i => i.type === 'figure_caption').content.map(c => f(c)).join('')
                : ''
            return wrap('figure',
                tag('graphic', {url: `${filename}`})
                + wrap('head', `Abbildung ${figCount}${caption ? ': ' : ''}${caption}`)
            )
        }

        if (item.type === 'image') {
            /* Do nothing, as images are handled when we encounter a figure node. */
            return ''
        }

        /* Handle table nodes and all their contents */
        if (item.type === 'table') {
            let caption = ''
            if (item.attrs.caption) {
                const captionTEI = item.content.find(it => it.type === 'table_caption').content
                    .map(it => f(it)).join('')
                caption = wrap('head', captionTEI)
            }
            const tableBody = item.content.find(it => it.type === 'table_body').content
            const tableTEI = tableBody.map(row => {
                const rowTEI = row.content.map(it => {
                    if (it.type === 'table_header') {
                        return wrap('cell', it.content.map(c => f(c)).join(''), {role: 'label'})
                    } else if (it.type === 'table_cell') {
                        return wrap('cell', it.content.map(c => f(c)).join(''))
                    }
                    return ''
                }).join('')
                const isLabel = row.content.filter(c => c.type === 'table_header').length === row.content.length
                return isLabel ? wrap('row', rowTEI, {role: 'label'}) : wrap('row', rowTEI)
            }).join('')
            return wrap('table', caption + tableTEI)
        }

        if (item.type.startsWith('table_')) {
            /* Do nothing, it gets handled by table elements */
            return ''
        }

        if (item.type === 'blockquote') {
            return wrap('quote', item.content.map(c => f(c)).join(''))
        }

        if (item.type === 'code_block') {
            return wrap('code', item.content.map(c => f(c)).join(''))
        }

        if (item.type === 'ordered_list') {
            const items = item.content.filter(c => c.type === 'list_item')
                .map(li => {
                    const liTEI = li.content.map(ic => f(ic)).join('')
                    return wrap('item', liTEI)
                })
                .join('')
            // Note that earlier versions of the TEI guidelines recommended
            // <list type="numbered"> instead.
            return wrap('list', items, {rend: 'ordered'})
        }
        if (item.type === 'bullet_list') {
            const items = item.content.filter(c => c.type === 'list_item')
                .map(li => {
                    const liTEI = li.content.map(ic => f(ic)).join('')
                    return wrap('item', liTEI)
                })
                .join('')
            // Note that earlier versions of the TEI guidelines recommended
            // <list type="bulleted"> instead.
            return wrap('list', items, {rend: 'bulleted'})
        }
        if (item.type === 'list_item') {
            // Do nothing, already handled in 'bullet_list' or 'ordered_list'.
            return ''
        }

        if (item.type === 'paragraph') {
            if (item.content === undefined) {
                return tag('lb')
            }
            return wrap('p', item.content.map(c => f(c)).join(''))
        }

        if (item.type.startsWith('heading')) {
            const order = parseInt(item.type.slice(-1))
            // Whenever the new heading is of a higher order (i.e. the number is smaller)
            // or the same as the preceding heading, we need to close our previous div(s).
            const closing = (order <= divLevel) ? '</div>'.repeat(divLevel + 1 - order) : ''
            divLevel = order
            const opening = `<div rend="DH-Heading">`
            const head = wrap('head', item.content.map(c => f(c)).join(''))
            return `${closing}${opening}${head}`
        }

        // console.log(`Could not parse richtextContent of type ${item.type}`)
        return ''
    }

    const result = richTextContent.map(c => f(c)).join('')
    const closing = '</div>'.repeat(divLevel)

    return `${result}${closing}`
}

function footnotesContent(footnotes) {
    const fns = footnotes.map((fn, idx) => {
        const i = idx + 1
        const text = richText(fn)
        return wrap('note', text, {n: i, rend: 'footnote text', 'xml:id': `ftn${i}`})
    }).join('')
    return wrap('div', fns, {type: 'notes'})
}


/**
 * This is the main entry point of this module. It takes the title-slug of
 * the document and the documents content object and generates a string
 * of TEI XML suitable for download.
 */
function convert(slug, docContents, bibDB, imgDB) {
    const fields = extract(docContents)

    // All the fields used in the TEI header:
    const authorsTEI = authors(fields.authors)
    const date = fields.date
    const keywordsTEI = keywords(fields.keywords)
    const title = wrap('title', fields.title, {type: 'main'})
    const subtitle = wrap('title', fields.subtitle, {type: 'sub'})
    const TEIheader = header(authorsTEI, title, date, keywordsTEI, subtitle)

    // All the fields used in the TEI body:
    const text = richText(fields.richText, imgDB)
    const TEIbody = body(text)

    // All the fields used in the TEI back:
    const footnotes = footnotesContent(fields.footnotes)
    const bib = bibliography(bibDB)
    const TEIback = back(footnotes, bib)

    return TEITemplate(slug, TEIheader, TEIbody, TEIback)
}

export {authors, richText, text, footnotesContent}
export default convert
