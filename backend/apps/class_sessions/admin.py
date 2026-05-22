from django.contrib import admin

from .models import ClassSession, ClassSessionAttendance


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "classroom",
        "teacher",
        "scheduled_date",
        "start_time",
        "end_time",
        "status",
        "livekit_room_name",
    ]
    list_filter = ["status", "scheduled_date"]
    search_fields = ["title", "teacher__email", "classroom__name", "livekit_room_name"]


@admin.register(ClassSessionAttendance)
class ClassSessionAttendanceAdmin(admin.ModelAdmin):
    list_display = [
        "session",
        "student",
        "joined_at",
        "left_at",
    ]
    search_fields = ["session__title", "student__email"]