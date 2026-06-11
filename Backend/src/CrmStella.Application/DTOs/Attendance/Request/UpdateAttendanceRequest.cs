using System.ComponentModel.DataAnnotations;
using CrmStella.Domain.Enums;

namespace CrmStella.Application.DTOs.Attendance.Request;

public class UpdateAttendanceRequest
{
    [Required] public AttendanceStatus Status { get; set; }
    public int? LateMinutes { get; set; }
    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }
}