using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.LessonScore.Request;

public class CreateLessonScoreRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "LessonId must be a positive integer")]
    public int LessonId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a positive integer")]
    public int StudentId { get; set; }

    public int? HomeworkSubmissionId { get; set; }

    [Required]
    [Range(0, 5, ErrorMessage = "Score must be between 0 and 100")]
    public decimal Score { get; set; }

    [MaxLength(1000, ErrorMessage = "MentorFeedback cannot exceed 1000 characters")]
    public string? MentorFeedback { get; set; }

    public int? ScoredByMentorId { get; set; }
}