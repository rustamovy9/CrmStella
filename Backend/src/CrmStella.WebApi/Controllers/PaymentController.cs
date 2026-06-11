using System.Security.Claims;
using CrmStella.Application.DTOs.Payment.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController(IPaymentService paymentService) : BaseController
{
    [Authorize(Roles = "Admin")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var result = await paymentService.GetFinanceDashboardAsync();
        if (!result.IsSuccess) return HandleError(result);
        return Ok(result);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await paymentService.GetAllAsync();

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await paymentService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}")]
    public async Task<IActionResult> GetByStudentId(int studentId)
    {
        var result = await paymentService.GetByStudentIdAsync(studentId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("group/{groupId:int}")]
    public async Task<IActionResult> GetByGroupId(int groupId)
    {
        var result = await paymentService.GetByGroupIdAsync(groupId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}/balance")]
    public async Task<IActionResult> GetStudentBalance(int studentId)
    {
        var result = await paymentService.GetStudentBalanceAsync(studentId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePaymentRequest request)
    {
        var userId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await paymentService.CreateAsync(request, userId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePaymentRequest request)
    {
        var result = await paymentService.UpdateAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(
        int id,
        [FromBody] ConfirmPaymentRequest request)
    {
        var result = await paymentService.ConfirmAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
    
    [Authorize(Roles = "Admin")]
    [HttpPost("top-up")]
    public async Task<IActionResult> TopUp([FromForm] TopUpRequest request)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await paymentService.TopUpAsync(request, currentUserId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
    
    [Authorize(Roles = "Admin")]
    [HttpPost("recalculate-balances")]
    public async Task<IActionResult> RecalculateBalances()
    {
        var result = await paymentService.RecalculateAllBalancesAsync();
        if (!result.IsSuccess) return HandleError(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/receipt")]
    public async Task<IActionResult> SetReceipt(
        int id,
        IFormFile receipt)
    {
        var userId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await paymentService.SetReceiptAsync(
            id,
            receipt,
            userId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await paymentService.DeleteAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}