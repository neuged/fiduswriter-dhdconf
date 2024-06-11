export const header = (authors, title, date, keywords, subtitle) => `
<teiHeader>
    <fileDesc>
        <titleStmt>
            ${title}
            ${subtitle}
            ${authors}
        </titleStmt>
        <publicationStmt>
            <publisher>Test: Fidus Writer</publisher>
        </publicationStmt>
        <sourceDesc>
            <p>Based on a Fidus Writer document</p>
        </sourceDesc>
    </fileDesc>
    <encodingDesc>
        <appInfo>
            <application ident="Fidus-Writer-TEI-Exporter" version="0.1">
            <label>Fidus Writer TEI Exporter</label>
            </application>
        </appInfo>
    </encodingDesc>
    <profileDesc>
        <textClass>
            ${keywords}
        </textClass>
    </profileDesc>
    <revisionDesc>
        <change when="${date}">exported from Fidus Writer</change>
    </revisionDesc>
</teiHeader>`
