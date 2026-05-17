using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.DTOs.Course.Request;

public class CreateCourseRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(150, ErrorMessage = "Name must be at most 150 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description must be at most 1000 characters")]
    public string? Description { get; set; }

    [Range(0, 1_000_000, ErrorMessage = "Price must be between 0 and 1 000 000")]
    public decimal Price { get; set; }

    [Range(1, 520, ErrorMessage = "Duration must be between 1 and 520 weeks")]
    public int DurationWeeks { get; set; }

    public IFormFile? Icon { get; set; }
}