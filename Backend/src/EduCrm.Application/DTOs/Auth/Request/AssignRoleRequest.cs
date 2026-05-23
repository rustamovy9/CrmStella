using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Auth.Request;

public class AssignRoleRequest
{
    [Required]
    [Range(1, 3, ErrorMessage = "Invalid role")]
    public int RoleId { get; set; }
}