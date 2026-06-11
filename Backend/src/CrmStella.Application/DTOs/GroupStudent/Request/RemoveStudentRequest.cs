using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.GroupStudent.Request;

public class RemoveStudentRequest
{
    [Required(ErrorMessage = "GroupStudentId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid GroupStudentId")]
    public int GroupStudentId { get; set; }

    [MaxLength(300, ErrorMessage = "Reason must be at most 300 characters")]
    public string? RemoveReason { get; set; }
}