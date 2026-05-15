using EduCrm.Domain.Enums;

namespace EduCrm.Domain.Entities;

public class Attendance
{
    public int Id { get; set; }

    public int LessonId { get; set; }
    public int StudentId { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }

    public int? MarkedByMentorId { get; set; }
    public DateTime MarkedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Mentor? MarkedByMentor { get; set; }
}