import json
import os.path

from django.core.management.base import BaseCommand

from document.models import DocumentTemplate
from ... import settings


class Command(BaseCommand):
    help = "Sets up the DHD conf extension: Changes the standard document template to DHD format."

    def _read_template_file(self) -> dict:
        with open(f"{os.path.dirname(__file__)}/../data/dhd_documenttemplate_content.json") as f:
            return json.load(f)

    def handle(self, *args, **options):

        content = self._read_template_file()
        content["attrs"]["footnote_elements"] = settings.DHD_ARTICLE_FOOTNOTE_ELEMENTS
        for elem in content["content"]:
            attrs = elem.get("attrs", {})
            if attrs.get("id", "") == "abstract":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_ABSTRACT_ELEMENTS
            elif attrs.get("id", "") == "body":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_BODY_ELEMENTS

        template = DocumentTemplate.objects.get(import_id='standard-article')
        template.content = content
        template.save()
