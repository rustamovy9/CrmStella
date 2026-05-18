using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Payment.Request;

public class ConfirmPaymentRequest
{
    [Required] public bool IsConfirmed { get; set; }
}