
from django.db import transaction

from document.models import Document


class DhdDocumentContentUpdate:

    def __init__(self):
        self.title = ""
        self.abstract = ""
        self.topics = []
        self.keywords = []
        self.contributors = []

    def set_title(self, title: str):
        self.title = title

    def set_abstract(self, abstract: str):
        self.abstract = abstract

    def set_topics(self, topics: list[str]):
        self.topics = topics

    def set_keywords(self, keywords: list[str]):
        self.keywords = keywords

    def add_contributor(self, firstname, lastname, email, institution, orcid):
        self.contributors.append({key: value for key, value in dict(
            firstname=firstname,
            lastname=lastname,
            email=email,
            institution=institution,
            _orcid=orcid  # prefix orcid because it is not part of the frontend data model, but see fiduswriter#1280
        ).items() if value})

    @classmethod
    def _update_part(cls, parts: list, part_type: str, part_id: str=None, content=None):
        for part in parts:
            try:
                applicable = (
                    content
                    and (part["type"] == part_type)
                    and (part_id is None or part["attrs"]["id"] == part_id)
                )
            except AttributeError:
                pass
            if applicable:
                part["content"] = content
                break

    def set_on(self, document=None, pk=None):
        if pk is None:
            pk = document.pk
        keywords = [
            {"type": "tag", "attrs": {"tag": kw}}
            for kw
            in sorted([*self.keywords, *self.topics])
        ]
        contributors = [
            {"type": "contributor", "attrs": c} for c in self.contributors
        ]
        title = [{"type": "text", "text": self.title}]
        abstract = [
            {"type": "paragraph", "content": [{"type": "text", "text": self.abstract}]}
        ]
        with transaction.atomic():
            if document := Document.objects.select_for_update().filter(pk=pk).first():
                parts = document.content.get("content", list())
                self._update_part(parts, "title", content=title)
                self._update_part(parts, "tags_part", "keywords", keywords)
                self._update_part(parts, "contributors_part", content=contributors)
                self._update_part(parts, "richtext_part", "abstract", abstract)
                document.content["content"] = parts
                document.save()
