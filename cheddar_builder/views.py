from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template.context import RequestContext

def home(request):
    return render_to_response("base.html", None, context_instance=RequestContext(request))
    
def shapes(request):
    return render_to_response("tests/shapes.html", None, context_instance=RequestContext(request))