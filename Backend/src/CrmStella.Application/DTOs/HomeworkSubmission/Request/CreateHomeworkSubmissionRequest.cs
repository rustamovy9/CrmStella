using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.HomeworkSubmission.Request;

public class CreateHomeworkSubmissionRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "HomeworkId must be a positive integer")]
    public int HomeworkId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a positive integer")]
    public int StudentId { get; set; }

    [MaxLength(5000, ErrorMessage = "TextAnswer cannot exceed 5000 characters")]
    public string? TextAnswer { get; set; }

    [MaxLength(500, ErrorMessage = "FileUrl cannot exceed 500 characters")]
    public string? FileUrl { get; set; }
}