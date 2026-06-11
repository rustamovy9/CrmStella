namespace CrmStella.Application.DTOs.Schedule.Request;

public class GetSchedulesQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public DayOfWeek? DayOfWeek { get; set; }
    public int? GroupId { get; set; }
}