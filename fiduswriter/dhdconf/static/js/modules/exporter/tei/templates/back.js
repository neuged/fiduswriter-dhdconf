export const back = (notes, bibliographyHead, bibliographyItems) => `
<back>
    ${notes}
    <div type="bibliogr">
        <listBibl>
            <head>${bibliographyHead}</head>
            ${bibliographyItems}
        </listBibl>
    </div>
</back>
`