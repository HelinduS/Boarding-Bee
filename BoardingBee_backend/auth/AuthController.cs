using BoardingBee_backend.Auth.Models;
using BoardingBee_backend.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace BoardingBee_backend.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _authService.Authenticate(request.Username, request.Password);
            if (user == null)
                return Unauthorized();

            var token = _authService.GenerateJwtToken(user);
            return Ok(new { token, role = user.Role });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
