from django.contrib import admin
from django.urls import path, include
#from .views import contactView, successView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('portfolio.urls')),
    #path('success/', successView, name='success'),
]
