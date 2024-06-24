import {
    authors,
    convertBody,
    text
} from './convert'


test('render a single author', () => {
    const data = [{
        firstname: 'Ben',
        lastname: 'H',
        email: 'ben@example.com',
        institution: 'PPOE'
    }]
    expect(authors(data)).toBe(
        '<author><persName>' +
        '<surname>H</surname><forename>Ben</forename></persName>' +
        '<affiliation>PPOE</affiliation>' +
        '<email>ben@example.com</email>' +
        '</author>')
})

test('render text-only node', () => {
    expect(
        text({
            type: 'text',
            text: 'hello',
        })
    ).toBe('hello')
})

test('render italic text', () => {
    expect(
        text({
            type: 'text',
            text: 'hello',
            marks: [{type: 'em'}]
        })
    ).toBe('<hi rend="italic">hello</hi>')
})

test('render bold text', () => {
    expect(
        text({
            type: 'text',
            text: 'hello',
            marks: [{type: 'strong'}]
        })
    ).toBe('<hi rend="bold">hello</hi>')
})

test('render single paragraph', () => {
    expect(convertBody([{
        type: 'paragraph',
        content: [{type: 'text', text: 'hello'}],
    }])).toStrictEqual(['<p>hello</p>', ''])
})

test('paragraph without content should just be a line break', () => {
    expect(convertBody([{
        type: 'paragraph',
        attrs: {track: []}
    }])).toStrictEqual(['<lb />', ''])
})

test('render paragraph with multiple children', () => {
    expect(convertBody([{
        type: 'paragraph',
        content: [{type: 'text', text: 'hello '}, {type: 'text', text: 'world', marks: [{type: 'em'}]}],
    }])).toStrictEqual(['<p>hello <hi rend="italic">world</hi></p>', ''])
})

test('render heading with a single piece of text', () => {
    expect(
        convertBody([{
            type: 'heading1',
            content: [{type: 'text', text: 'hello'}],
        }])
    ).toStrictEqual(['<div rend="DH-Heading"><head>hello</head></div>', ''])
})

test('render heading with italic text', () => {
    expect(
        convertBody([
            {
                type: 'heading1',
                content: [
                    {type: 'text', text: 'hello '},
                    {type: 'text', text: 'world', marks: [{type: 'em'}]},
                ],
            },
        ])
    ).toStrictEqual([
        '<div rend="DH-Heading"><head>hello <hi rend="italic">world</hi></head></div>',
        ''
    ])
})

test('render heading and following paragraph', () => {
    expect(
        convertBody([
            {
                type: 'heading1',
                content: [{type: 'text', text: 'hello'}],
            },
            {
                type: 'paragraph',
                content: [{type: 'text', text: 'world'}],
            },
        ])
    ).toStrictEqual(['<div rend="DH-Heading"><head>hello</head><p>world</p></div>', ''])
})

test('render second order heading', () => {
    expect(
        convertBody([{
            type: 'heading2',
            content: [{type: 'text', text: 'hello'}],
        }])
    ).toStrictEqual(['<div rend="DH-Heading"><head>hello</head></div></div>', ''])
})

test('render two headings', () => {
    expect(
        convertBody([
            {
                type: 'heading1',
                content: [{type: 'text', text: 'first'}],
            },
            {
                type: 'heading2',
                content: [{type: 'text', text: 'second'}],
            },
        ])
    ).toStrictEqual([
        '<div rend="DH-Heading"><head>first</head>' +
        '<div rend="DH-Heading"><head>second</head></div></div>',
        ''
    ])
})

test('render consecutive headings', () => {
    expect(
        convertBody([
            {type: 'heading1', content: [{type: 'text', text: 'one'}]},
            {type: 'heading1', content: [{type: 'text', text: 'another'}]},
        ])
    ).toStrictEqual([
        '<div rend="DH-Heading"><head>one</head></div>' +
        '<div rend="DH-Heading"><head>another</head></div>',
        ''
    ])
})

test('render footnotes (inside the main text)', () => {
    expect(
        convertBody([{
            type: 'footnote',
            attrs: {
                footnote: [
                    {type: 'paragraph', content: [{type: 'text', text: 'note of the foot'}]},
                ],
            },
        }])
    ).toStrictEqual([
        '<ref n="1" target="ftn1" />',
        '<div type="notes"><note n="1" rend="footnote text" xml:id="ftn1"><p>note of the foot</p></note></div>'
    ])
})

test('consecutive footnotes (inside the main text) must be numbered', () => {
    expect(
        convertBody([
            {
                type: 'footnote',
                attrs: {
                    footnote: [
                        {type: 'paragraph', content: [{type: 'text', text: 'note of the foot'}]},
                    ],
                }
            },
            {
                type: 'footnote',
                attrs: {
                    footnote: [
                        {type: 'paragraph', content: [{type: 'text', text: 'foot of the note'}]},
                    ],
                }
            }
        ])
    ).toStrictEqual([
        '<ref n="1" target="ftn1" /><ref n="2" target="ftn2" />',
        '<div type=\"notes\">' +
            '<note n=\"1\" rend=\"footnote text\" xml:id=\"ftn1\"><p>note of the foot</p></note>\n' +
            '<note n=\"2\" rend=\"footnote text\" xml:id=\"ftn2\"><p>foot of the note</p></note>' +
        '</div>'
    ])
})

test('render equations', () => {
    expect(
        convertBody([
            {
                type: 'equation',
                attrs: {
                    equation: 'A=\\pi\\cdot r^2'
                }
            }
        ])
    ).toStrictEqual(['<formula notation="tex">$A=\\pi\\cdot r^2$</formula>', ''])
})

test('render a simple figure', () => {
    const content = [
        {
            type: 'figure',
            attrs: {caption: false},
            content: [
                {
                    type: 'image',
                    attrs: {image: 1}
                }
            ]
        }
    ]
    const imgDB = {db: {1: {image: '/media/images/stuff.png'}}}
    expect(
        convertBody(content, imgDB)
    ).toStrictEqual([
        '<figure><graphic url="images/stuff.png" /><head>Abbildung 1</head></figure>',
        ''
    ])
})

test('render a figure with caption', () => {
    const content = [
        {
            type: 'figure',
            attrs: {caption: true},
            content: [
                {
                    type: 'image',
                    attrs: {image: 1}
                },
                {
                    type: "figure_caption",
                    content: [
                        {
                            type: "text",
                            text: "a caption"
                        }
                    ]
                }
            ]
        }
    ]
    const imgDB = {db: {1: {image: '/media/images/stuff.png'}}}
    expect(
        convertBody(content, imgDB)
    ).toStrictEqual([
        '<figure><graphic url="images/stuff.png" /><head>Abbildung 1: a caption</head></figure>',
        ''
    ])
})

test('render a simple table', () => {
    const content = [
        {
            type: 'table',
            attrs: {caption: false},
            content: [
                {type: 'table_body', content: [
                    {type: 'table_row', content: [
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '1'}
                        ]}]},
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '2'}
                        ]}]}
                    ]},
                    {type: 'table_row', content: [
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '3'}
                        ]}]},
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '4'}
                        ]}]}
                    ]}
                ]}
            ]
        }
    ]
    const expected = '<table>' +
                   '<row><cell><p>1</p></cell><cell><p>2</p></cell></row>' +
                   '<row><cell><p>3</p></cell><cell><p>4</p></cell></row>' +
                   '</table>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render a table with caption', () => {
    const content = [
        {
            type: 'table',
            attrs: {caption: true},
            content: [
                {type: 'table_caption', content: [
                    {type: 'paragraph', content: [{type: 'text', text: 'caption'}]}]
                },
                {type: 'table_body', content: [
                    {type: 'table_row', content: [
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '1'}
                        ]}]},
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '2'}
                        ]}]}
                    ]},
                    {type: 'table_row', content: [
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '3'}
                        ]}]},
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '4'}
                        ]}]}
                    ]}
                ]}
            ]
        }
    ]
    const expected = '<table><head><p>caption</p></head>' +
                   '<row><cell><p>1</p></cell><cell><p>2</p></cell></row>' +
                   '<row><cell><p>3</p></cell><cell><p>4</p></cell></row>' +
                   '</table>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render a table with header row', () => {
    const content = [
        {
            type: 'table',
            attrs: {caption: false},
            content: [
                {type: 'table_body', content: [
                    {type: 'table_row', content: [
                        {type: 'table_header', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '1'}
                        ]}]},
                        {type: 'table_header', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '2'}
                        ]}]}
                    ]},
                    {type: 'table_row', content: [
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '3'}
                        ]}]},
                        {type: 'table_cell', content: [{type: 'paragraph', content: [
                            {type: 'text', text: '4'}
                        ]}]}
                    ]}
                ]}
            ]
        }
    ]
    const expected = '<table>' +
                   '<row role="label"><cell role="label"><p>1</p></cell><cell role="label"><p>2</p></cell></row>' +
                   '<row><cell><p>3</p></cell><cell><p>4</p></cell></row>' +
                   '</table>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render a blockquote', () => {
    const content = [
        {
            type: "blockquote",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "a block quote."
                        }
                    ]
                }
            ]
        }
    ]
    const expected = '<quote><p>a block quote.</p></quote>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render source code snippets', () => {
    const content = [
        {
            "type": "code_block",
            "attrs": {
                "track": []
            },
            "content": [
                {
                    "type": "text",
                    "text": "# source code\ndef random():\n    # determined by fair dice roll\n    return 3"
                }
            ]
        }
    ]
    const expected = '<code># source code\ndef random():\n    '
                 + '# determined by fair dice roll\n    return 3</code>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render a simple unordered list', () => {
    const content = [
        {
            "type": "bullet_list",
            "content": [
                {
                    "type": "list_item",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "ein Listenpunkt"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "noch einer"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
    const expected = '<list rend="bulleted">'
                 + '<item><p>ein Listenpunkt</p></item>'
                 + '<item><p>noch einer</p></item>'
                 + '</list>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})

test('render a simple ordered list', () => {
    const content = [
        {
            "type": "ordered_list",
            "content": [
                {
                    "type": "list_item",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "erster Listenpunkt."
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "zweiter Listenpunkt"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
    const expected = '<list rend="ordered">'
                 + '<item><p>erster Listenpunkt.</p></item>'
                 + '<item><p>zweiter Listenpunkt</p></item>'
                 + '</list>'
    expect(convertBody(content)).toStrictEqual([expected, ''])
})