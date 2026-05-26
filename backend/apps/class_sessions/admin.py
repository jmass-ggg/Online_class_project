from django.contrib import admin

from .models import ClassSession, ClassSessionAttendance


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = (
        "session_name",
        "classroom",
        "teacher",
        "scheduled_date",
        "start_time",
        "end_time",
        "status",
        "created_at",
    )
    list_filter = (
        "status",
        "scheduled_date",
        "teacher",
    )
    search_fields = (
        "classroom__name",
        "teacher__email",
        "teacher__full_name",
        "livekit_room_name",
    )
    readonly_fields = (
        "id",
        "livekit_room_name",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)

    def session_name(self, obj):
        return f"{obj.classroom.name} - {obj.scheduled_date}"

    session_name.short_description = "Session"


@admin.register(ClassSessionAttendance)
class ClassSessionAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "session",
        "student",
        "joined_at",
        "left_at",
    )
    list_filter = (
        "joined_at",
        "left_at",
    )
    search_fields = (
        "student__email",
        "student__full_name",
        "session__classroom__name",
    )
    readonly_fields = (
        "id",
        "joined_at",
    )