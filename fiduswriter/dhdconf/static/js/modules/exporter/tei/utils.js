/**
 * Create a string of an empty XML tag.
 */
function tag(tagName, attrs = {}) {
    if (Object.keys(attrs).length) {
        const attributes = Object.entries(attrs)
            .map(([key, value]) => `${key}="${value}"`)
            .join(" ")
        return `<${tagName} ${attributes} />`
    }
    return `<${tagName} />`
}

/**
 * Wrap content in a string with opening and closing XML tags.
 */
function wrap(tagName, content, attrs = {}) {
    if (Object.keys(attrs).length) {
        const attributes = Object.entries(attrs)
            .map(([key, val]) => `${key}="${val}"`)
            .join(" ")
        return `<${tagName} ${attributes}>${content}</${tagName}>`
    }
    return `<${tagName}>${content}</${tagName}>`
}

/**
 * Convenience function to wrap elements where only text is expected
 */
function wrapText(tagName, content, attrs = {}) {
    return wrap(tagName, escapeXmlText(content), attrs)
}

function linkRef(target, text) {
    return wrap("ref", text, {target})
}

function linkPtr(target) {
    return tag("ptr", {target})
}

const LINK_REGEX = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig
const DOI_REGEX = /doi:(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i  // https://www.crossref.org/blog/dois-and-matching-regular-expressions/
const TRAILING = /[.,]$/
function linkify(text) {
    const linkified = text.replace(LINK_REGEX, linkPtr)
    return linkified.replace(DOI_REGEX, (substring, doiGroup) => {
        const match = doiGroup.match(TRAILING)
        if (match) {
            const url = `https://doi.org/${doiGroup.replace(TRAILING, "")}`
            return linkRef(url, url) + match[0]
        } else {
            const url = `https://doi.org/${doiGroup}`
            return linkRef(url, url)
        }
    })
}

function escapeXmlText(text) {
    // NOTE: Only usable for XML text nodes as single and double-quotes are not escaped
    return text.replace(/[<>&]/g, function(c) {
        switch (c) {
        case "<": return "&lt;"
        case ">": return "&gt;"
        case "&": return "&amp;"
        }
    })
}

export {tag, wrap, wrapText, linkPtr, linkRef, linkify, escapeXmlText}