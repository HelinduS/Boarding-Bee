using BoardingBee_backend.Models;
using BoardingBee_backend.Models;
using Microsoft.EntityFrameworkCore;
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
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Username and password are required.");
            }
            var user = _authService.Authenticate(request.Username, request.Password);
            if (user == null)
                return Unauthorized();

            var token = _authService.GenerateJwtToken(user);
            return Ok(new { token, role = user.Role });
        }

        [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, [FromServices] AppDbContext db)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required." });
            }
            if (await db.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email))
            {
                return BadRequest(new { message = "Username or email already exists." });
            }

            var user = new BoardingBee_backend.Models.User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _authService.HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PermanentAddress = request.PermanentAddress,
                Gender = request.Gender,
                EmergencyContact = request.EmergencyContact,
                UserType = request.UserType,
                InstitutionCompany = request.InstitutionCompany,
                Location = request.Location,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new { message = "Registration successful." });
        }

        public class RegisterRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string? PhoneNumber { get; set; }
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string PermanentAddress { get; set; } = string.Empty;
            public string Gender { get; set; } = string.Empty;
            public string EmergencyContact { get; set; } = string.Empty;
            public string UserType { get; set; } = string.Empty;
            public string InstitutionCompany { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
        }
    }

    public class LoginRequest
    {
    public string? Username { get; set; }
    public string? Password { get; set; }
    }
}
