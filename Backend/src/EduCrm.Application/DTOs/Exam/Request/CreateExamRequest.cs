using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Exam.Request;

public class CreateExamRequest
{
    [Required(ErrorMessage = "GroupId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid GroupId")]
    public int GroupId { get; set; }

    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description must be at most 2000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "ExamDate is required")]
    public DateTime ExamDate { get; set; }

    [Range(1, 100, ErrorMessage = "MaxScore must be between 1 and 100")]
    public decimal MaxScore { get; set; } = 100;

    [Range(1, 100, ErrorMessage = "PassScore must be between 1 and 100")]
    public decimal PassScore { get; set; } = 60;
}