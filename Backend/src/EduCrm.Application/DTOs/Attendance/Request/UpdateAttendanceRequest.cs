using System.ComponentModel.DataAnnotations;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.DTOs.Attendance.Request;

public class UpdateAttendanceRequest
{
    [Required] public AttendanceStatus Status { get; set; }

    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }
}