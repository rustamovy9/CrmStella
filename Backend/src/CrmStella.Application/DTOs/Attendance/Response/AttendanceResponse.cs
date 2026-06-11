namespace CrmStella.Application.DTOs.Attendance.Response;

public class AttendanceResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; } = null!;
    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }
    public int? MarkedByMentorId { get; set; }
    public int? LateMinutes { get; set; }
    public string? MarkedByMentorName { get; set; }
    public DateTime MarkedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}