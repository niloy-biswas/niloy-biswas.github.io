import os


print ("On development database")

ALLOWED_HOSTS = ['niloyportfolio.herokuapp.com', '127.0.0.1', 'niloy.me']


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}
