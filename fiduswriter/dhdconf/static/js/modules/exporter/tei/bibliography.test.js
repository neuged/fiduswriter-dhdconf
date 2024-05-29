import {name, biblItem} from "./bibliography"


test('create TEI for names like inside author tags', () => {
    const data = {
        given: [{type: 'text', text: 'Alice'}],
        family: [{type: 'text', text: 'Bob'}]
    }
    const expected = '<name><surname>Bob</surname><forename>Alice</forename></name>'
    expect(name(data)).toBe(expected)
})

test('create bibl entry with formatted title', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            title: [
                {
                    type: "text",
                    text: "TextGrid",
                    marks: [{type: "nocase"}]
                },
                {
                    type: "text",
                    text: ", "
                },
                {
                    type: "text",
                    text: "TEXTvre",
                    marks: [{"type": "nocase"}]
                },
                {
                    type: "text",
                    text: ": Sustainability of Infrastructures"
                }
            ]
        }
    }
    const expected = '<bibl>'
                   + '<title>TextGrid, TEXTvre: Sustainability of Infrastructures</title>'
                   + '</bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('create bibl entry with multiple authors', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            author: [
                {
                    family: [{"type": "text", "text": "He"}],
                    given: [{"type": "text", "text": "Mark"}]
                },
                {
                    family: [{"type": "text", "text": "Ne"}],
                    given: [{"type": "text", "text": "Heike"}]
                }
            ]
        }
    }
    const expected = '<bibl>'
                   + '<author><name><surname>He</surname><forename>Mark</forename></name></author>'
                   + '<author><name><surname>Ne</surname><forename>Heike</forename></name></author>'
                   + '</bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('create bibl entry with multiple editors', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            editor: [
                {
                    family: [{type: "text", text: "Bla"}],
                    given: [{type: "text", text: "Tobias"}]
                },
                {
                    family: [{type: "text", text: "Rom"}],
                    given: [{type: "text", text: "Laurent"}]
                }
            ]
        }
    }
    const expected = '<bibl><editor>'
                   + '<name><surname>Bla</surname><forename>Tobias</forename></name>'
                   + '</editor><editor>'
                   + '<name><surname>Rom</surname><forename>Laurent</forename></name>'
                   + '</editor></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('additional editors (editora) are also editors', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            editora: [
                {
                    family: [{type: "text", text: "Bla"}],
                    given: [{type: "text", text: "Tobias"}]
                },
                {
                    family: [{type: "text", text: "Rom"}],
                    given: [{type: "text", text: "Laurent"}]
                }
            ]
        }
    }
    const expected = '<bibl><editor>'
                + '<name><surname>Bla</surname><forename>Tobias</forename></name>'
                + '</editor><editor>'
                + '<name><surname>Rom</surname><forename>Laurent</forename></name>'
                + '</editor></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with an URL', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            url: "http://jtei.revues.org/774"
        }
    }
    const expected = '<bibl><ref target="http://jtei.revues.org/774">'
                 + 'http://jtei.revues.org/774'
                 + '</ref></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with an DOI', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            doi: "10.4000/jtei.774"
        }
    }
    const expected = '<bibl><idno type="DOI">10.4000/jtei.774</idno></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with an ISSN', () => {
    // Note that for some reason, issn are stored as a list of text-type objects by
    // Fidus Writer, unlike DOI which are stored as plain strings.
    const data = {
        bib_type: "article-journal",
        fields: {
            issn: [
                {
                    type: "text",
                    text: "2162-5603"
                }
            ]
        }
    }
    const expected = '<bibl><idno type="ISSN">2162-5603</idno></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with an ISBN', () => {
    // Note that for some reason, ISBN are stored as a list of text-type objects by
    // Fidus Writer, unlike DOI which are stored as plain strings.
    const data = {
        bib_type: "article-journal",
        fields: {
            isbn: [
                {
                    type: "text",
                    text: "978-3-499-55628-9"
                }
            ]
        }
    }
    const expected = '<bibl><idno type="ISBN">978-3-499-55628-9</idno></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with journal title', () => {
    const data = {
        bib_type: "article-journal",
        fields: {
            journaltitle: [
                {
                    type: "text",
                    text: "Journal of the Text Encoding Initiative"
                }
            ]
        }
    }
    const expected = '<bibl><title level="j">Journal of the Text Encoding Initiative</title></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with publishing place', () => {
    const data = {
        fields: {
            location: [
                [
                    {
                        type: "text",
                        text: "Reinbek bei Hamburg"
                    }
                ]
            ]
        }
    }
    const expected = '<bibl><pubPlace>Reinbek bei Hamburg</pubPlace></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with publisher', () => {
    // Note that there can be multiple publishers, each specified by an array of text objects.
    // That means that we deal with an array of arrays.
    const data = {
        fields: {
            publisher: [
                [
                    {
                        type: "text",
                        text: "rowohlts enzyklopädie im Rowohlt Taschenbuch Verlag"
                    }
                ]
            ]
        }
    }
    const expected = '<bibl><publisher>rowohlts enzyklopädie im Rowohlt Taschenbuch Verlag'
                 + '</publisher></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with date', () => {
    const data = {
        fields: {
            date: '2017'
        }
    }
    const expected = '<bibl><date when="2017">2017</date></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with issue data', () => {
    const data = {
        fields: {
            issue: [
                {
                    type: "text",
                    text: "Issue 5"
                }
            ]
        }
    }
    const expected = '<bibl><biblScope unit="issue">Issue 5</biblScope></bibl>'
    expect(biblItem(data)).toBe(expected)
})

test('bibl entry with edition stmt', () => {
    const data = {
        fields: {
            edition: [
                {
                    type: "text",
                    text: "12. Auflage, Originalausgabe"
                }
            ]
        }
    }
    const expected = '<bibl><edition>12. Auflage, Originalausgabe</edition></bibl>'
    expect(biblItem(data)).toBe(expected)
})