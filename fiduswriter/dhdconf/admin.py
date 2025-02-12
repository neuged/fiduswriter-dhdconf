from django.contrib import admin

from dhdconf.models import ConftoolUser, ConftoolDocument, ConftoolEmail, ConftoolAccessRight, ConftoolUserInvite, \
    ImportLog


@admin.register(ConftoolUser)
class ConftoolUserAdmin(admin.ModelAdmin):
    pass


@admin.register(ConftoolDocument)
class ConftoolDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "conftool_id",
        "id",
        "title",
    )


@admin.register(ConftoolEmail)
class ConftoolEmailAdmin(admin.ModelAdmin):
    pass


@admin.register(ConftoolUserInvite)
class ConftoolUserInviteAdmin(admin.ModelAdmin):
    pass


@admin.register(ConftoolAccessRight)
class ConftoolAccessRightAdmin(admin.ModelAdmin):
    pass


@admin.register(ImportLog)
class ImportLogAdmin(admin.ModelAdmin):
    readonly_fields = (
        "success",
        "request_id",
        "path",
        "error_type",
        "user",
        "message",
        "conftool_paper_id",
        "stacktrace",
        "added",
    )
    search_fields = (
        "request_id",
        "path",
        "error_type",
        "message",
        "stacktrace",
    )
    list_display = (
        "success",
        "request_id",
        "path",
        "error_type",
        "user",
        "message",
        "conftool_paper_id",
        "added",
    )
    list_display_links = ("success", "message")
    list_filter = (
        "success",
        "error_type",
        "added",
    )
