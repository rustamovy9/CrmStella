using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Payment.Request;

public class ConfirmPaymentRequest
{
    [Required] public bool IsConfirmed { get; set; }
}