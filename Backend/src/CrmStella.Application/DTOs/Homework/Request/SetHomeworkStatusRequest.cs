using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Homework.Request;

public class SetHomeworkStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}