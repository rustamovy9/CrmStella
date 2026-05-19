using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Homework.Request;

public class SetHomeworkStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}