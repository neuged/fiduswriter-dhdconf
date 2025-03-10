from django.core.management.base import BaseCommand

from dhdconf.document import ensure_dhd_document_template
from style.models import ExportTemplate, DocumentStyle


class Command(BaseCommand):
    # TODO: Change this to not alter the existing document template, export templates
    # To achieve this, we would need to provide our own DocumentStyle see the fixtures
    # in `fiduswriter.style`
    help = (
        "Set up the dhdconf plugin. Note: Currently this will override the standard "
        "document template and delete most existing export templates and document "
        "styles."
    )


    @staticmethod
    def delete_export_templates():
        ExportTemplate.objects.all().delete()

    @staticmethod
    def delete_document_styles():
        DocumentStyle.objects.exclude(slug__in=["acm", "springer"]).delete()

    def handle(self, *args, **options):
        self.stdout.write("Setting up DHd Article template")
        ensure_dhd_document_template(reset_to_defaults=True)
        self.stdout.write("Deleting export templates and document styles")
        self.delete_export_templates()
        self.delete_document_styles()
