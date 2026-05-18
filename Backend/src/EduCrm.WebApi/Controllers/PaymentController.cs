using EduCrm.Application.DTOs.Payment.Request;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController(IPaymentService paymentService) : BaseController
{
    // ──────────────────────────────────────────────
    // GET
    // ──────────────────────────────────────────────

    [HttpGet]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetAll()
    {
        var result = await paymentService.GetAllAsync();

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    [HttpGet("student/{studentId:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        var result = await paymentService.GetByStudentIdAsync(studentId);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    [HttpGet("group/{groupId:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetByGroup(int groupId)
    {
        var result = await paymentService.GetByGroupIdAsync(groupId);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await paymentService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    [HttpGet("student/{studentId:int}/balance")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetStudentBalance(int studentId)
    {
        var result = await paymentService.GetStudentBalanceAsync(studentId);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    // ──────────────────────────────────────────────
    // POST
    // ──────────────────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreatePaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId();

        var result = await paymentService.CreateAsync(request, userId);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data!.Id },
            result.Data
        );
    }

    // ──────────────────────────────────────────────
    // PUT
    // ──────────────────────────────────────────────

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await paymentService.UpdateAsync(id, request);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    [HttpPatch("{id:int}/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmPaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await paymentService.ConfirmAsync(id, request);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(new
        {
            message = "Payment confirmation status updated"
        });
    }

    [HttpPatch("{id:int}/receipt")]
    [Authorize(Roles = "Admin,Mentor")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SetReceipt(int id, IFormFile receipt)
    {
        if (receipt is null || receipt.Length == 0)
            return BadRequest("Receipt file is required");

        var userId = GetCurrentUserId();

        var result = await paymentService.SetReceiptAsync(id, receipt, userId);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return Ok(result.Data);
    }

    // ──────────────────────────────────────────────
    // DELETE
    // ──────────────────────────────────────────────

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await paymentService.DeleteAsync(id);

        if (!result.IsSuccess)
            return HandleFailure(result);

        return NoContent();
    }

    // ──────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────

    private IActionResult HandleFailure<T>(Application.Common.Result<T> result)
    {
        return result.ErrorType switch
        {
            ErrorType.NotFound => NotFound(result.Error),

            ErrorType.Validation => BadRequest(result.Error),

            ErrorType.Unauthorized => Unauthorized(result.Error),

            ErrorType.Forbidden => StatusCode(403, result.Error),

            ErrorType.Conflict => Conflict(result.Error),

            _ => StatusCode(500, result.Error)
        };
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("userId")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(claim, out var id) ? id : 0;
    }
}