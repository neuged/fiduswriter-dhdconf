/**
 * Normalize a string to create a slug depending on whether title or not
 *
 * @param {string} str - String to normalize
 * @param {boolean} isTitle - whether is title or not
 * @returns {string} Resulting slug.
 */
const slugify = (str, isTitle) => {
    if (str === "" && isTitle) {
        str = gettext("Untitled")
    } else if (str === "" && !isTitle) {
        str = gettext("UNKNOWN")
    }

    str = str.replace(/[^a-zA-Z0-9\s]/g, "")
    str = str.toLowerCase()
    str = str.replace(/\s/g, "-")

    return str
}

export const createSlug = str => {
    str = slugify(str, true)

    if (str.length > 128) {
        str = str.substring(0, 128)
    }

    return str
}

/**
 * Create a slug from a last name string and convert it to uppercase.
 *
 * @param {string} str - The last name string to slugify.
 * @returns {string} The slugified last name in uppercase.
 */
export const createSlugLastName = str => {
    str = slugify(str, false)

    return str.toUpperCase()
}
