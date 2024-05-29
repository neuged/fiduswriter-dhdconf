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

export {tag, wrap}