using System.Security.Claims;
using CrmStella.Application.DTOs.Lead.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[ApiController]
[Route("api/leads")]
[Authorize]
public class LeadsController(ILeadService leadService) : ControllerBase
{
    private int GetUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetAll([FromQuery] LeadQueryRequest query)
    {
        var result = await leadService.GetAllAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await leadService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest request)
    {
        var result = await leadService.CreateAsync(request, GetUserId());
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeadRequest request)
    {
        var result = await leadService.UpdateAsync(id, request, GetUserId());
        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeLeadStatusRequest request)
    {
        var result = await leadService.ChangeStatusAsync(id, request, GetUserId());
        return Ok(result);
    }

    [HttpPatch("{id:int}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignManager(int id, [FromBody] AssignLeadManagerRequest request)
    {
        var result = await leadService.AssignManagerAsync(id, request, GetUserId());
        return Ok(result);
    }

    [HttpPost("{id:int}/activities")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> AddActivity(int id, [FromBody] CreateLeadActivityRequest request)
    {
        var result = await leadService.AddActivityAsync(id, request, GetUserId());
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await leadService.DeleteAsync(id, GetUserId());
        return Ok(result);
    }
}