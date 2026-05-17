using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Group.Request;

public class SetGroupStatusRequest
{
    [Required(ErrorMessage = "Status is required")]
    [Range(1, 4, ErrorMessage = "Status must be 1=Active, 2=Completed, 3=Paused, 4=Cancelled")]
    public int Status { get; set; }
}