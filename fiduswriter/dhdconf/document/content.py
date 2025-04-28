
from django.db import transaction

from document.models import Document


class DhdDocumentContentUpdate:

    ORCID_ID_UNKNOWN = "<ORCID: N/A>"

    def __init__(self):
        self.title = ""
        self.abstract = ""
        self.contribution_type = ""
        self.keywords = []
        self.topics = []
        self.contributors = []
        self.orcid_ids = []

    def set_title(self, title: str):
        self.title = title

    def set_abstract(self, abstract: str):
        self.abstract = abstract

    def set_contribution_type(self, contribution_type: str):
        self.contribution_type = contribution_type

    def set_keywords(self, keywords: list[str]):
        self.keywords = keywords

    def set_topics(self, topics: list[str]):
        self.topics = topics

    def add_contributor(self, firstname, lastname, email, institution, orcid):
        self.contributors.append({key: value for key, value in dict(
            firstname=firstname,
            lastname=lastname,
            email=email,
            institution=institution,
        ).items() if value})
        self.orcid_ids.append(orcid if orcid else self.ORCID_ID_UNKNOWN)

    @classmethod
    def _update_part(cls, parts: list, part_type: str, part_id: str=None, content=None):
        for part in parts:
            try:
                if (
                    content
                    and (part["type"] == part_type)
                    and (part_id is None or part["attrs"]["id"] == part_id)
                ):
                    part["content"] = content
                    break
            except (KeyError, AttributeError):
                pass


    def set_on(self, document=None, pk=None):
        if pk is None:
            pk = document.pk
        ctype = [{"type": "tag", "attrs": {"tag": self.contribution_type}}]
        keywords = [{"type": "tag", "attrs": {"tag": i}} for i in sorted(self.keywords)]
        topics = [{"type": "tag", "attrs": {"tag": i}} for i in sorted(self.topics)]
        contributors = [{"type": "contributor", "attrs": i} for i in self.contributors]
        orcid_ids = [{"type": "tag", "attrs": {"tag": i }} for i in self.orcid_ids]
        title = []
        visible_title = []
        abstract = []
        if self.title:
            title = [{"type": "text", "text": self.title}]
            visible_title = [
                {"type": "heading1", "content": [{"type": "text", "text": self.title}]}
            ]
        if self.abstract:
            abstract = [
                {"type": "paragraph", "content": [
                    {"type": "text", "text": self.abstract}
                ]}
            ]

        with transaction.atomic():
            if locked := Document.objects.select_for_update().filter(pk=pk).first():
                parts = locked.content.get("content", list())
                self._update_part(parts, "title", content=title)
                self._update_part(parts, "heading_part", "visibleTitle", visible_title)
                self._update_part(parts, "tags_part", "contributionTypes", ctype)
                self._update_part(parts, "tags_part", "keywords", keywords)
                self._update_part(parts, "tags_part", "topics", topics)
                self._update_part(parts, "tags_part", "orcidIds", orcid_ids)
                self._update_part(parts, "contributors_part", content=contributors)
                self._update_part(parts, "richtext_part", "abstract", abstract)
                locked.content["content"] = parts
                locked.save()
        if document:
            document.refresh_from_db(fields=('content',))
