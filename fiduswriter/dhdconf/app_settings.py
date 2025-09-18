import os

CONFTOOL_URL = os.environ.get('CONFTOOL_URL')
CONFTOOL_APIPASS = os.environ.get('CONFTOOL_APIPASS')

BLOCK_USER_CHANGES = True
BLOCK_NEW_DOCUMENT = True
BLOCK_USERMEDIA_CATEGORIES = True
BLOCK_BIBLIO_CATEGORIES = True
BLOCK_DOCUMENT_SHARING = True

DHD_ARTICLE_TEMPLATE_ID = "standard-article"
DHD_ARTICLE_TEMPLATE_TITLE = "DHd Article"
DHD_ARTICLE_ATTRS = {
    "template": DHD_ARTICLE_TEMPLATE_TITLE,
    "import_id": DHD_ARTICLE_TEMPLATE_ID,
    "footnote_elements": [
        "paragraph",
        "equation",
        "citation",
        "cross_reference"
    ],
    "footnote_marks": [
        "strong",
        "em",
        "link"
    ],
    "papersize": "A4",
    "papersizes": [
        "A4"
    ],
    "citationstyle": "chicago-author-date-de",
    "citationstyles": [
        "chicago-author-date-16th-edition",
        "chicago-author-date-de",
    ],
    "language": "de-DE",
    "languages": [
        "en-AU", "en-CA", "en-NZ", "en-ZA", "en-GB", "en-US",
        "de-DE", "de-AU", "de-CH"
    ],
    "bibliography_header": {
        "de-DE": "Bibliographie",
        "de-AU": "Bibliographie",
        "de-CH": "Bibliographie"
    },
}

DHD_ARTICLE_ABSTRACT_ELEMENTS = [
    "paragraph",
]
DHD_ARTICLE_ABSTRACT_MARKS = []

DHD_ARTICLE_BODY_ELEMENTS = [
    "paragraph",
    "heading1",
    "heading2",
    "heading3",
    "figure",
    "ordered_list",
    "bullet_list",
    "equation",
    "citation",
    "cross_reference",
    "footnote",
    "table",
    "code_block"
]
DHD_ARTICLE_BODY_MARKS = [
    "strong",
    "em",
    "link"
]

TEI_EXPORT_PUBLICATION_STATEMENT = """
    <publisher>Test: Fidus Writer</publisher>
"""
