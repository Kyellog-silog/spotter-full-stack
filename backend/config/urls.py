from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "milepost-eld-backend"})


urlpatterns = [
    path("", health),
    path("api/", include("api.urls")),
]
