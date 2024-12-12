import {
    extractAbstract,
    extractAuthors,
    extractImageIDs,
    extractKeywords,
    extractBody,
    extractSubtitle,
    extractTitle
} from "./extract"


const dummyDoc = (cont) => {
    return {
        type: "article",
        content: cont
    }
}

test("extract empty subtitle", () => {
    const doc = dummyDoc([
        {type: "heading_part", attrs: {id: "subtitle"}, content: [{type: "heading1"}]}
    ])
    expect(extractSubtitle(doc)).toBe("")
})

test("extract simple subtitle", () => {
    const content = [{
        type: "heading_part",
        attrs: {id: "subtitle"},
        content: [
            {
                type: "heading1",
                content: [{type: "text", text: "hello"}]
            }
        ]}
    ]
    const doc = dummyDoc(content)
    expect(extractSubtitle(doc)).toBe("hello")
})

test("extraction of authorship data", () => {
    const content = [{
        type: "contributors_part",
        attrs: {id: "authors"},
        content: [
            {type: "contributor", attrs: {firstname: "Henning", lastname: "Gebhard", institution: "Uni Trier", email: "hg@example.com"}},
            {type: "contributor", attrs: {firstname: "Ben", lastname: "Harding", institution: "Discordian Society", email: "none@example.com"}}
        ]
    }]
    const doc = dummyDoc(content)
    expect(
        extractAuthors(doc)
    ).toEqual([
        {"firstname": "Henning", "lastname": "Gebhard", "institution": "Uni Trier", "email": "hg@example.com"},
        {"firstname": "Ben", "lastname": "Harding", "institution": "Discordian Society", "email": "none@example.com"}
    ])
})

test("extraction of document title", () => {
    const content = [{
        type: "title",
        attrs: {id: "title"},
        content: [{type: "text", text: "a title"}]
    }]
    const doc = dummyDoc(content)
    expect(extractTitle(doc)).toBe("a title")
})

test("extract keywords", () => {
    const content = [{
        type: "tags_part", attrs: {id: "keywords"}, content: [
            {type: "tag", attrs: {tag: "tagA"}},
            {type: "tag", attrs: {tag: "tagB"}}
        ]
    }]
    const doc = dummyDoc(content)
    expect(extractKeywords(doc)).toEqual(["tagA", "tagB"])
})

// TODO: Test extractTextNodes

// TODO: Test extractCitations

test("extract body", () => {
    const content = [{
        type: "richtext_part", attrs: {id: "body"}, content: [
            {type: "paragraph", content: [{type: "text", text: "hello"}]}
        ]
    }]
    const doc = dummyDoc(content)
    expect(extractBody(doc)).toStrictEqual(content[0])
})

test("extract abstract", () => {
    const content = [{
        type: "richtext_part", attrs: {id: "abstract"}, content: []
    }]
    const doc = dummyDoc(content)
    expect(extractAbstract(doc)).toStrictEqual(content[0])
})

test("extract image IDs", () => {
    const content = [{
        type: "richtext_part", attrs: {id: "body"}, content: [
            {
                type: "figure",
                content: [
                    {type: "image", attrs: {image: 1}}
                ]
            }
        ]
    }]
    const doc = dummyDoc(content)
    expect(
        extractImageIDs(doc)
    ).toEqual([1])
})

test("extract image ID inside paragraph", () => {
    const content = [{
        type: "richtext_part",
        attrs: {id: "body"},
        content: [{
            type: "paragraph",
            content: [{
                type: "figure",
                content: [
                    {type: "image", attrs: {image: 1}}
                ]
            }]
        }]
    }]
    const doc = dummyDoc(content)
    expect(
        extractImageIDs(doc)
    ).toEqual([1])
})