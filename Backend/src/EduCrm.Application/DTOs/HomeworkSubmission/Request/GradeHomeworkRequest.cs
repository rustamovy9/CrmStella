using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.HomeworkSubmission.Request;

public class GradeHomeworkRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Id must be a positive integer")]
    public int Id { get; set; }

    [Required]
    [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
    public int Score { get; set; }

    [MaxLength(1000, ErrorMessage = "Feedback cannot exceed 1000 characters")]
    public string? Feedback { get; set; }
}