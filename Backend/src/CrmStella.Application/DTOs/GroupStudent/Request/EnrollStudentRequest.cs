using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.GroupStudent.Request;

public class EnrollStudentRequest
{
    [Required(ErrorMessage = "GroupId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid GroupId")]
    public int GroupId { get; set; }

    [Required(ErrorMessage = "StudentId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid StudentId")]
    public int StudentId { get; set; }
}