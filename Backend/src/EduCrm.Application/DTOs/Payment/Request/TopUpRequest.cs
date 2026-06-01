using Microsoft.AspNetCore.Http;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.DTOs.Payment.Request;

public class TopUpRequest
{
    public int StudentId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Note { get; set; }
    public IFormFile? Receipt { get; set; }
}