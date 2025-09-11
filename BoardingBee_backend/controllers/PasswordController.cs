using System.Threading.Tasks;
using BoardingBee_backend.Controllers.Dto;
using BoardingBee_backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordController : ControllerBase
    {
        private readonly IPasswordResetService _reset;

        public PasswordController(IPasswordResetService reset) => _reset = reset;

        // Step 1: start (send code)
        [HttpPost("forgot")]
        public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email)) return BadRequest("email required");
            await _reset.StartAsync(req.Email);
            return Ok(); // always OK (don’t leak whether email exists)
        }

        // Step 2: verify code
        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyCodeRequest req)
        {
            var ok = await _reset.VerifyAsync(req.Email, req.Code);
            if (!ok) return Unauthorized();
            return Ok();
        }

        // Step 3: reset password
        [HttpPost("reset")]
        public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req)
        {
            var ok = await _reset.ResetAsync(req.Email, req.Code, req.NewPassword);
            if (!ok) return Unauthorized();
            return Ok();
        }
    }
}
