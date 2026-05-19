using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Homework.Request;

public class UpdateHomeworkRequest
{
    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters")]
    public string? Title { get; set; }

    [MaxLength(2000, ErrorMessage = "Description must be at most 2000 characters")]
    public string? Description { get; set; }

    public DateTime? Deadline { get; set; }

    [Range(1, 100, ErrorMessage = "MaxScore must be between 1 and 100")]
    public int? MaxScore { get; set; }
}