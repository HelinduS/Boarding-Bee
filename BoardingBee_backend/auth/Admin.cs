// auth/Admin.cs
using BoardingBee_backend.Models;   // <-- add this

namespace BoardingBee_backend.Auth
{
    public class Admin : User    // <-- now resolves to Models.User
    {
        // ... keep your properties/methods as-is
    }
}
