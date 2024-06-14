/**
 * All functions in this module con operate on the complete docContents object
 *
 * @module
 */

function extractAuthors(docContents) {
    const authorPart = docContents.content.find(part => part.type === 'contributors_part')
    const authors = authorPart.content
        .filter(item => item.type === 'contributor')
        .map(author => author.attrs)
    return authors
}

function extractCitations(node, citations=[]) {
    switch (node.type) {
    case "citation":
        citations.push(JSON.parse(JSON.stringify(node.attrs)))
        break
    case "footnote":
        node.attrs.footnote.forEach(child => extractCitations(child, citations))
        break
    default:
        break
    }
    if (node.content) {
        node.content.forEach(child => extractCitations(child, citations))
    }
    return citations;
}

/**
 * For every part of type 'footnote', extract the array with the
 * actual text contents. So, this returns an array of arrays.
 */
function extractFootnotes(docContents) {
    const body = extractRichText(docContents)
    const fns = []
    const stack = [body]

    while (stack.length) {
        const curr = stack.pop()

        if (curr.type !== undefined && curr.type == 'footnote') {
            fns.push(curr.attrs.footnote)
        } else if (curr.content !== undefined) {
            for (const v of curr.content) {
                stack.push(v)
            }
        } else if (Array.isArray(curr)) {
            for (const v of curr) {
                stack.push(v)
            }
        }
    }
    return fns
}

function extractImageIDs(docContents) {
    const richtext = extractRichText(docContents)
    const images = []
    const stack = [richtext]

    while (stack.length) {
        const node = stack.pop()
        if (node.type === 'figure') {
            const ids = node.content
                .filter(it => it.type === 'image')
                .map(it => it.attrs.image)
            for (const n of ids) {
                images.push(n)
            }
        } else if (node.content) {
            for (const it of node.content) {
                stack.push(it)
            }
        } else if (Array.isArray(node)) {
            for (const it of node) {
                stack.push(it)
            }
        }
    }
    return images
}

function extractKeywords(docContents) {
    const kwPart = docContents.content.find(part => part.type === 'tags_part')
    const keywords = kwPart.content
        .filter(item => item.type === 'tag')
        .map(kw => kw.attrs.tag)
    return keywords
}

function extractRichText(docContents) {
    const body = docContents.content.find(part => {
        return part.type === 'richtext_part' && part.attrs.id === 'body'
    })
    return body.content
}

function extractTitle(docContents) {
    const titlePart = docContents.content.find(part => part.type === 'title')
    const title = titlePart.content.find(item => item.type === 'text')
    return title.text
}

function extractSubtitle(docContents) {
    const subtitle = docContents.content
        ?.find(part => part.type === 'heading_part' && part.attrs.id === 'subtitle')
        ?.content
        ?.find(part => part.type === 'heading1')
        ?.content
        ?.filter(item => item.type === 'text')
        .map(item => item.text)
        .join('');
    return subtitle || ''
}

function extractTextNodes(node, texts=[]) {
    if (node.type === "text") {
        texts.push(node);
    }
    node.content?.forEach(child => extractTextNodes(child, texts))
    return texts;
}

/**
 * This is the main entry point of this module.
 */
function extract(docContents, _docSettings) {
    const currentDate = new Date().toISOString()

    const authors = extractAuthors(docContents)
    const footnotes = extractFootnotes(docContents)
    const keywords = extractKeywords(docContents)
    const richText = extractRichText(docContents)
    const subtitle = extractSubtitle(docContents)
    const citations = extractCitations(docContents)
    const title = extractTitle(docContents)

    return {
        authors,
        footnotes,
        keywords,
        richText,
        subtitle,
        title,
        citations,
        date: currentDate,
    }
}

export {
    extractAuthors,
    extractCitations,
    extractFootnotes,
    extractImageIDs,
    extractKeywords,
    extractRichText,
    extractSubtitle,
    extractTitle,
    extractTextNodes
}
export default extract
