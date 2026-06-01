namespace EduCrm.Application.DTOs.Billing.Response;

public class BillingResultResponse
{
    public int StudentId { get; set; }
    public int GroupId { get; set; }
    public decimal AmountCharged { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public bool WentNegative { get; set; }
    public decimal? DebtAmount { get; set; }
    public DateTime NextBillingDate { get; set; }
    public int PaymentId { get; set; }
}