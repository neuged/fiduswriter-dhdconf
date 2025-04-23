# FidusWriter-DHDConf

FidusWriter-DHDConf is a [Fidus Writer](https://github.com/fiduswriter/fiduswriter/) plugin used to organize collaborative writing for submissions to [DHD conferences](https://dig-hum.de).

Users can login with their [conftool]() credentials.

## Setup

In your `configuration.py` add `dhdconf` to the list of installed apps:

```py
INSTALLED_APPS = [
	...
    "dhdconf"
]
```

In the same file add the authentication backend `ConftoolBackend`.

You can keep Djangos `ModelBackend` if you want to allow logins by users who are not registered in conftool (e.g. for admin accounts).

```py
AUTHENTICATION_BACKENDS = [
    "dhdconf.conftool.auth.ConftoolBackend",
    "django.contrib.auth.backends.ModelBackend",
]
```

This plugin further assumes that all non-admin users will login with their conftool credentials and email verification is handled on the confttol side. The following settings reflect this. Setting these to different values is not recommended.

```py
PASSWORD_LOGIN = True
REGISTRATION_OPEN = False
SOCIALACCOUNT_OPEN = False
ACCOUNT_EMAIL_VERIFICATION = "none"
```

Add our middleware setting:

```py
MIDDLEWARE = [
    "dhdconf.middleware.RequestBlockingMiddleware"
]
```

## Local setup for development

Set this up together with a fiduswriter clone:

```sh
git clone git@github.com:fiduswriter/fiduswriter.git fiduswriter
cd fiduswriter

# Add conftool test variables to the environment
python -m venv ./venv
cat <<-EOF >> venv/bin/activate
export CONFTOOL_URL=https://www.conftool.net/demo/dhdtest_26j/rest.php
export CONFTOOL_APIPASS=<apipass>
EOF
source venv/bin/activate

cd fiduswriter
pip install -r requirements.txt -r dev-requirements.txt -r test-requirements.txt -r postgresql-requirements.txt ipython

ln -s ../../fiduswriter-dhdconf-plugin/fiduswriter/dhdconf dhdconf
cp ~/Documents/Projekte/fiduswriter.project/configuration.dev.py ./configuration.py

./manage.py migrate
./manage.py dhdconf_setup
./manage.py runserver
```


### Testing

Run (our) tests from the fiduswriter setup described above:

```
./manage.py jest
./manage.py test dhdconf
```
