import json
import os

from django.conf import settings
from django.db import transaction

from document.models import DocumentTemplate


@transaction.atomic
def ensure_dhd_document_template(reset_to_defaults=False) -> DocumentTemplate:
    template, created = DocumentTemplate.objects.get_or_create(
        import_id=settings.DHD_ARTICLE_TEMPLATE_ID
    )
    if created or reset_to_defaults:
        template.title = settings.DHD_ARTICLE_TEMPLATE_TITLE
        content = _read_template_file()
        content["attrs"] = {**content["attrs"], **settings.DHD_ARTICLE_ATTRS}
        for elem in content["content"]:
            attrs = elem.get("attrs", {})
            if attrs.get("id", "") == "abstract":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_ABSTRACT_ELEMENTS
                elem["attrs"]["marks"] = settings.DHD_ARTICLE_ABSTRACT_MARKS
            elif attrs.get("id", "") == "body":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_BODY_ELEMENTS
                elem["attrs"]["marks"] = settings.DHD_ARTICLE_BODY_MARKS
        template.content = content
        template.save()
    return template


def _read_template_file() -> dict:
    with open(f"{os.path.dirname(__file__)}/data/template.json") as f:
        return json.load(f)
