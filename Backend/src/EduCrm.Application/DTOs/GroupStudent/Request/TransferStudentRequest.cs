using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.GroupStudent.Request;

public class TransferStudentRequest
{
    [Required(ErrorMessage = "GroupStudentId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid GroupStudentId")]
    public int GroupStudentId { get; set; } // текущая активная запись

    [Required(ErrorMessage = "TargetGroupId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid TargetGroupId")]
    public int TargetGroupId { get; set; } // куда переводим

    [MaxLength(300, ErrorMessage = "Reason must be at most 300 characters")]
    public string? Reason { get; set; }
}