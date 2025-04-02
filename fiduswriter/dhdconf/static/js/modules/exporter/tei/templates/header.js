export const header = (authors, title, keywords, subtitle, abstract, publicationStmt) => `
<teiHeader>
    <fileDesc>
        <titleStmt>
            ${title}
            ${subtitle}
            ${authors}
        </titleStmt>
        <publicationStmt>
            ${publicationStmt}
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
        <abstract>
            ${abstract}
        </abstract>
    </profileDesc>
</teiHeader>`
