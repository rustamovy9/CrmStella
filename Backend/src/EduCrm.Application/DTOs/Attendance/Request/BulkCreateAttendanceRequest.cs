using System.ComponentModel.DataAnnotations;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.DTOs.Attendance.Request;

public class BulkCreateAttendanceRequest
{
    [Required] public int LessonId { get; set; }

    [Required] public List<StudentAttendanceItem> Students { get; set; } = [];
}

public class StudentAttendanceItem
{
    [Required] public int StudentId { get; set; }

    [Required] public AttendanceStatus Status { get; set; }

    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }
}