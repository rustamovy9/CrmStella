using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize(Roles = "Admin")]
public class BillingController(IBillingService billingService) : BaseController
{
    [HttpPost("charge")]
    public async Task<IActionResult> ChargeStudent([FromBody] ChargeStudentRequest req)
    {
        var result = await billingService.ChargeMonthlyAsync(req.StudentId, req.GroupId);
        return result.IsSuccess ? Ok(result) : HandleError(result);
    }

    [HttpPost("process-due")]
    public async Task<IActionResult> ProcessDue()
    {
        var result = await billingService.ProcessDueBillingsAsync();
        return result.IsSuccess ? Ok(result) : HandleError(result);
    }
}

public class ChargeStudentRequest
{
    public int StudentId { get; set; }
    public int GroupId { get; set; }
}