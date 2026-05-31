
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

