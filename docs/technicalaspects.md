
# Technical Aspects 

## The configuration of Fiduswriter

The `configuration.py` of FidusWriter **must have** the following code:

```py
BASE_INSTALLED_APPS = []
INSTALLED_APPS = [
    "dhdconf",
    "npm_mjs",
    "base",
    "daphne",
    "django.contrib.admin",  
    "django.contrib.auth",
    "allauth.socialaccount",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.sites",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.admindocs",
    "django.contrib.flatpages",
    "channels",
    "axes",  # django-axes for brute-force protection (can be disabled via REMOVED_APPS)
    "django_otp",  # Two-factor authentication (can be disabled via REMOVED_APPS)
    "django_otp.plugins.otp_totp",
    "django_js_error_hook",
    "loginas",
    "fixturemedia",
    "browser_check",
    "menu",
    "document",
    "bibliography",
    "usermedia",
    "user",
    "allauth",
    "allauth.account",
    "avatar",
    "feedback",
    "style",
    "user_template_manager",
]

# A list of apps to remove from the default installation
# This is useful for disabling features you don't need
REMOVED_APPS = [
    # Example: Disable two-factor authentication entirely
    "django_otp",
    # Example: Disable brute-force protection (for development only)
    "axes",
    "django_otp.plugins.otp_totp",
]
```

The reason for explicitly adding all APPS to the list is that we have to
be sure that the Javascript files of our plugin are loaded first because
otherwise we can not overwrite the original files of FidusWriter.

In our plugin we have to overwrite two files of the original
FidusWriter: 

1. The file
   [file.js](https://github.com/fiduswriter/fiduswriter/blob/main/fiduswriter/document/static/js/modules/exporter/tools/file.js)
   because we create our own slug pattern for files. 
   
2. The file
   [convert.js](https://github.com/fiduswriter/fiduswriter/blob/main/fiduswriter/document/static/js/modules/exporter/html/convert.js)
   of the HTML-Exporter. The reason is that we create own our `walkJson`
   function in order to export the ORCIC ids in the way we want to. 
   
To overwrite the code our plugin dhdconf **must be** in the first place
of the installed plugins because of the way Fiduswriter import files to
be transpiled. See the details
[here](https://github.com/fiduswriter/fiduswriter/issues/1388). 

## Our changes 

### Changing language changes citation style

For our plugin we want to add the following feature: changing the
language of the document changes also the citation style. The only two
work languages are English and German and each has a citation style
associated. We need therefore a kind of toggle mechanism. 

Two changes are necessary.

The first one is a more "aesthetic" one. We remove from the menu the
ability to change manually the citation style. See [this
commit](https://github.com/DHd-Verband/fiduswriter-dhcon/commit/5a7805152c6b40f6766eecf7ed349ab93bb0c213). 

The second one is more involved. For capturing changes in the menu, we
have to create a plugin for prosemirror. See the discussion
[here](https://github.com/fiduswriter/fiduswriter/issues/1404) and the
[documentation of prosemirror](https://prosemirror.net/docs/ref/). See
the details [in this
commit](https://github.com/DHd-Verband/fiduswriter-dhcon/commit/7d0edc07480736e4ec2bcf1f37f219c200bb6d92).


