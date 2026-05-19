using EduCrm.Application.DTOs.AuditLog.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
public class AuditLogController(IAuditLogService auditLogService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> Query([FromQuery] AuditLogQuery query)
    {
        var result = await auditLogService.QueryAsync(query);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}