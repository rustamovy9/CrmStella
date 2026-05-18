namespace EduCrm.Application.DTOs.Attendance.Response;

public class AttendanceListItemResponse
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime MarkedAt { get; set; }
}