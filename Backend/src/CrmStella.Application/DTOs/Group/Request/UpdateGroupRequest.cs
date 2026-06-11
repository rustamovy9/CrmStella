using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Group.Request;

public class UpdateGroupRequest
{
    [MaxLength(150, ErrorMessage = "Name must be at most 150 characters")]
    public string? Name { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Invalid MentorId")]
    public int? MentorId { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [Range(1, 100, ErrorMessage = "MaxStudents must be between 1 and 100")]
    public int? MaxStudents { get; set; }
}