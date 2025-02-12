from django.core.management.base import BaseCommand

from dhdconf.document import ensure_dhd_document_template
from style.models import ExportTemplate


class Command(BaseCommand):
    # TODO: Change this to not alter the existing document template, export templates
    # To achieve this, we would need to provide our own DocumentStyle and ExportTemplate
    # or copy some from the 'style' modules fixtures
    help = (
        "Set up the dhdconf plugin. Note: Currently this will override the standard "
        "document template and delete most existing export templates."
    )


    def delete_export_templates(self):
        ExportTemplate.objects.exclude(file_type="docx").delete()

    def handle(self, *args, **options):
        self.stdout.write("Setting up DHd Article template")
        ensure_dhd_document_template(reset_to_defaults=True)
        self.stdout.write("Deleting export templates")
        self.delete_export_templates()
