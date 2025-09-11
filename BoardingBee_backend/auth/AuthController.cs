// auth/AuthController.cs
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BoardingBee_backend.Auth;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        public AuthController(IAuthService auth)
        {
            _auth = auth;
        }

        public class LoginRequest
        {
            [Required]
            public string Username { get; set; } = string.Empty; // can be email or username

            [Required]
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _auth.AuthenticateAsync(req.Username, req.Password);
            if (user == null) return Unauthorized();

            var token = await _auth.GenerateJwtAsync(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role
                }
            });
        }
    }
}
