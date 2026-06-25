using CrmStella.Application.DTOs.GroupStudent.Response;

namespace CrmStella.Application.DTOs.Mentor.Response;

public class MentorGroupDetailsResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int CourseId { get; set; }

    public string CourseName { get; set; } = null!;

    public int MentorId { get; set; }

    public int MentorUserId { get; set; }

    public string MentorName { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int MaxStudents { get; set; }

    public int ActiveStudentsCount { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string ScheduleSummary { get; set; } = string.Empty;

    public List<GroupStudentResponse> Students { get; set; } = [];
}
