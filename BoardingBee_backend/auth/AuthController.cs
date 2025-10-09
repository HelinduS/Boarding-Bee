using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using BoardingBee_backend.Models;          // AppDbContext
using BoardingBee_backend.Auth.Services;   // IAuthService
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee_backend.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Handles authentication endpoints for login and registration.
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        // Constructor injecting the authentication service.
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ----------------------------- LOGIN -----------------------------
        // Authenticates a user and returns a JWT token if successful.
        // Accepts either username or email as the identifier.
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request,
            [FromServices] AppDbContext db)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid request." });

            // Required fields
            if (string.IsNullOrWhiteSpace(request.Identifier) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Identifier and password are required." });
            }

            var looksLikeEmail = request.Identifier.Contains("@");
            if (looksLikeEmail && !IsValidEmail(request.Identifier))
            {
                return BadRequest(new { message = "Please enter a valid email address." });
            }

            // Check if account exists (to distinguish wrong password vs unknown user)
            if (looksLikeEmail)
            {
                var exists = await db.Users.AnyAsync(u => u.Email == request.Identifier);
                if (!exists)
                    return BadRequest(new { message = "No account found for this email." });
            }
            else
            {
                var exists = await db.Users.AnyAsync(u => u.Username == request.Identifier);
                if (!exists)
                    return BadRequest(new { message = "No account found for this username." });
            }

            // Authenticate via service (verifies password)
            var user = _authService.Authenticate(request.Identifier, request.Password);
            if (user == null)
                return Unauthorized(new { message = "Incorrect password." });

            var token = _authService.GenerateJwtToken(user);
            return Ok(new
            {
                message = "Login successful.",
                token,
                role = user.Role
            });
        }

        // --------------------------- REGISTER ---------------------------
        // Registers a new user if username and email are unique.
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request,
            [FromServices] AppDbContext db)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid request." });

            // Required fields
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email, username and password are required." });
            }

            // Email format
            if (!IsValidEmail(request.Email))
                return BadRequest(new { message = "Please enter a valid email address." });

            // Password rule (keep simple)
            if (request.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters." });

            // Normalize role (default USER)
            var role = string.IsNullOrWhiteSpace(request.Role) ? "USER" : request.Role.Trim().ToUpperInvariant();
            if (role != "USER" && role != "OWNER")
                return BadRequest(new { message = "Role must be USER or OWNER." });

            // Duplicate checks (separate messages)
            var emailExists = await db.Users.AnyAsync(u => u.Email == request.Email);
            if (emailExists)
                return Conflict(new { message = "Email is already registered." });

            var usernameExists = await db.Users.AnyAsync(u => u.Username == request.Username);
            if (usernameExists)
                return Conflict(new { message = "Username is already taken." });

            var user = new BoardingBee_backend.Models.User
            {
                Username = request.Username.Trim(),
                Email = request.Email.Trim(),
                PasswordHash = _authService.HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                FirstName = request.FirstName ?? string.Empty,
                LastName = request.LastName ?? string.Empty,
                PermanentAddress = request.PermanentAddress ?? string.Empty,
                Gender = request.Gender ?? string.Empty,
                EmergencyContact = request.EmergencyContact ?? string.Empty,
                UserType = request.UserType ?? string.Empty,
                Role = role, // normalized
                InstitutionCompany = request.InstitutionCompany ?? string.Empty,
                Location = request.Location ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new { message = "Registration successful." });
        }

        // -------------------------- Helpers -----------------------------
        private static bool IsValidEmail(string email)
        {
            try
            {
                return new EmailAddressAttribute().IsValid(email);
            }
            catch { return false; }
        }

        // ---------------------------- DTOs ------------------------------
        public class RegisterRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;

            public string? PhoneNumber { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? PermanentAddress { get; set; }
            public string? Gender { get; set; }
            public string? EmergencyContact { get; set; }
            public string? UserType { get; set; }
            public string? InstitutionCompany { get; set; }
            public string? Location { get; set; }

            // Accepts 'USER' or 'OWNER' (case-insensitive). Defaults to USER.
            public string? Role { get; set; }
        }

        // Login request model that accepts either username or email as the identifier
        public class LoginRequest
        {
            public string? Identifier { get; set; } // username or email
            public string? Password { get; set; }
        }
    }
}
