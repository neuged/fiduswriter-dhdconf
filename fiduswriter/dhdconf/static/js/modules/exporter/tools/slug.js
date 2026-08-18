import {createSlug} from "./file"

export const authorSlug = author => {
    return author.lastname && author.firstname
        ? `${author.lastname.toUpperCase()}-${author.firstname}`
        : (author.lastname ? author.lastname.toUpperCase() : "UNKNOWN-AUTHOR")
}

export const titleSlug = title => {
    const slug = createSlug(title).split("-")
    return slug.slice(0, 5).join("-") + (slug[5] ? "_" : "")
}
