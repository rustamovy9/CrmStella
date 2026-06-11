namespace CrmStella.Application.DTOs.Payment.Response;

public class PaymentResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = null!;

    public int? GroupId { get; set; }
    public string GroupName { get; set; } = null!;

    public decimal Amount { get; set; }

    public string Type { get; set; } = null!;
    public string Method { get; set; } = null!;

    public DateTime Date { get; set; }
    public DateTime? DueDate { get; set; }

    public bool IsConfirmed { get; set; }
    public string? Note { get; set; }
    public string? ReceiptUrl { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByFullName { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PaymentListItemResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = null!;

    public int? GroupId { get; set; }
    public string GroupName { get; set; } = null!;

    public decimal Amount { get; set; }

    public string Type { get; set; } = null!;
    public string Method { get; set; } = null!;

    public DateTime Date { get; set; }

    public bool IsConfirmed { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class StudentBalanceResponse
{
    public int StudentId { get; set; }
    public string StudentFullName { get; set; } = null!;
    public decimal Balance { get; set; }
}