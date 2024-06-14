/**
 * Create a string of an empty XML tag.
 */
function tag(tagName, attrs = {}) {
    if (Object.keys(attrs).length) {
        const attributes = Object.entries(attrs)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ')
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
            .join(' ')
        return `<${tagName} ${attributes}>${content}</${tagName}>`
    }
    return `<${tagName}>${content}</${tagName}>`
}

function linkRef(target, text) {
    return wrap("ref", text, { target })
}

function linkPtr(target) {
    return tag("ptr", { target })
}

const LINK_REGEX = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
function linkify(text) {
    return text.replace(LINK_REGEX, linkPtr);
}


export {tag, wrap, linkPtr, linkRef, linkify}