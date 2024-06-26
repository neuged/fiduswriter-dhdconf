import json
import os.path

from django.core.management.base import BaseCommand

from document.models import DocumentTemplate
from style.models import ExportTemplate
from ... import settings


class Command(BaseCommand):
    help = "Sets up the DHD conf extension: Changes the standard document template to DHD format."

    def _read_template_file(self) -> dict:
        with open(f"{os.path.dirname(__file__)}/../data/dhd_documenttemplate_content.json") as f:
            return json.load(f)

    def setup_standard_article(self):
        content = self._read_template_file()
        content["attrs"] = {**content["attrs"], **settings.DHD_ARTICLE_ATTRS}
        for elem in content["content"]:
            attrs = elem.get("attrs", {})
            if attrs.get("id", "") == "abstract":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_ABSTRACT_ELEMENTS
                elem["attrs"]["marks"] = settings.DHD_ARTICLE_ABSTRACT_MARKS
            elif attrs.get("id", "") == "body":
                elem["attrs"]["elements"] = settings.DHD_ARTICLE_BODY_ELEMENTS
                elem["attrs"]["marks"] = settings.DHD_ARTICLE_BODY_MARKS

        template = DocumentTemplate.objects.get(import_id='standard-article')
        template.content = content
        template.save()

    def delete_export_templates(self):
        ExportTemplate.objects.exclude(file_type="docx").delete()

    def handle(self, *args, **options):
        self.stdout.write("Adjusting standard article template")
        self.setup_standard_article()
        self.stdout.write("Deleting existing export templates")
        self.delete_export_templates()
