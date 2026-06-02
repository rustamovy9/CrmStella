namespace EduCrm.Application.DTOs.Attendance.Response;

public class AttendanceListItemResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? LateMinutes { get; set; }
    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }
    public DateTime MarkedAt { get; set; }
}