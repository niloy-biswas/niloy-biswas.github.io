# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.views.generic import TemplateView
from django.core.mail import send_mail

from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404

class HomeView(TemplateView):
    template_name = "home.html"

    def get_context_data(self, **kwargs):
        context = super(HomeView, self).get_context_data(**kwargs)
        return context

def home(request):
    if request.method == "POST":
        message_name = request.POST['message-name']
        message_email = request.POST['message-email']
        message = request.POST['message']

        #send email
        send_mail(
            message_name, #subject
            message , #message
            message_email , #form email
            ['niloy35-225@diu.edu.bd'], # to email
            )

        return render(request, 'home.html', {'message_name': message_name})
    else:
        return render(request, 'home.html', {})