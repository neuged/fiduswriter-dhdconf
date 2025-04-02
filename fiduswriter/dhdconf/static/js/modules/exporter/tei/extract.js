/**
 * All functions in this module con operate on the complete docContents object
 *
 * @module
 */

function extractAuthors(docContents) {
    const authors = docContents.content
        ?.find(part => part.type === "contributors_part")
        ?.content
        ?.filter(item => item.type === "contributor")
        .map(author => author.attrs)
    return authors || []
}

function extractCitations(node, citations = []) {
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
    return citations
}

/**
 * For every part of type 'footnote', extract the array with the
 * actual text contents. So, this returns an array of arrays.
 */
function extractFootnotes(docContents) {
    const body = extractBody(docContents)
    const fns = []
    const stack = [body.content]

    while (stack.length) {
        const curr = stack.pop()

        if (curr.type !== undefined && curr.type === "footnote") {
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
    const body = extractBody(docContents)
    const images = []
    const stack = [body.content]

    while (stack.length) {
        const node = stack.pop()
        if (node.type === "figure") {
            const ids = node.content
                .filter(it => it.type === "image")
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

function extractTagList(docContents, id) {
    const tags = docContents.content
        ?.find(part => part.type === "tags_part" && part.attrs?.id === id)
        ?.content
        ?.filter(item => item.type === "tag")
        .map(kw => kw.attrs.tag)
    return tags || []
}

function extractOrcidIds(docContents) {
    const orcidIds = extractTagList(docContents, "orcidIds")
        .map(s => s?.match(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]{1}$/) ? s : "")
    return orcidIds || []
}

function extractBody(docContents) {
    return docContents.content.find(part => {
        return part.type === "richtext_part" && part.attrs.id === "body"
    })
}

function extractAbstract(docContents) {
    return docContents.content.find(part => {
        return part.type === "richtext_part" && part.attrs.id === "abstract"
    })
}

function extractTitle(docContents) {
    const title = docContents.content
        ?.find(part => part.type === "title")
        ?.content
        ?.find(item => item.type === "text")
        ?.text
    return title || ""
}

function extractSubtitle(docContents) {
    const subtitle = docContents.content
        ?.find(part => part.type === "heading_part" && part.attrs.id === "subtitle")
        ?.content
        ?.find(part => part.type === "heading1")
        ?.content
        ?.filter(item => item.type === "text")
        .map(item => item.text)
        .join("")
    return subtitle || ""
}

function extractTextNodes(node, texts = []) {
    if (node.type === "text") {
        texts.push(node)
    }
    node.content?.forEach(child => extractTextNodes(child, texts))
    return texts
}

/**
 * This is the main entry point of this module.
 */
function extract(docContents, _docSettings) {
    const abstract = extractAbstract(docContents)
    const authors = extractAuthors(docContents)
    const footnotes = extractFootnotes(docContents)
    const tags = {
        contributionTypes: extractTagList(docContents, "contributionTypes"),
        keywords: extractTagList(docContents, "keywords"),
        topics: extractTagList(docContents, "topics")
    }
    const orcidIds = extractOrcidIds(docContents)
    const body = extractBody(docContents)
    const subtitle = extractSubtitle(docContents)
    const citations = extractCitations(docContents)
    const title = extractTitle(docContents)

    return {
        abstract,
        authors,
        footnotes,
        tags,
        orcidIds,
        body,
        subtitle,
        title,
        citations,
    }
}

export {
    extractAbstract,
    extractAuthors,
    extractCitations,
    extractFootnotes,
    extractImageIDs,
    extractTagList,
    extractOrcidIds,
    extractBody,
    extractSubtitle,
    extractTitle,
    extractTextNodes
}
export default extract
