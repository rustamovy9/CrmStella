namespace CrmStella.Application.DTOs.Payment.Response;

public class FinanceDashboardResponse
{
    public decimal TotalBalance { get; set; }     
    public decimal TotalDebt { get; set; }          
    public int StudentsInDebt { get; set; }        
    public decimal TotalIncome { get; set; }      
    public int StudentsPaid { get; set; }      
}