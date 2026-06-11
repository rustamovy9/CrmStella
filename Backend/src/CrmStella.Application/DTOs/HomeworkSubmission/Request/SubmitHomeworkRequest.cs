using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CrmStella.Application.DTOs.HomeworkSubmission.Request;

public class SubmitHomeworkRequest
{
    [Required(ErrorMessage = "HomeworkId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid HomeworkId")]
    public int HomeworkId { get; set; }

    [MaxLength(4000, ErrorMessage = "Text answer must be at most 4000 characters")]
    public string? TextAnswer { get; set; }

    public IFormFile? File { get; set; }
}