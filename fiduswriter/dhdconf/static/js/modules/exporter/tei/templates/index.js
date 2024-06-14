export const TEITemplate = (slug, header, body, back) =>
    `<?xml version="1.0" encoding="UTF-8"?>
<TEI xml:id="${slug}" xmlns="http://www.tei-c.org/ns/1.0">
${header}
<text>
    ${body}
    ${back}
</text>
</TEI>
`
