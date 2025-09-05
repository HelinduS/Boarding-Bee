
export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  // Simple hash for demo only (use a secure hash in production)
  function simpleHash(str) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash.toString();
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/Users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.name,
          email: form.email,
          passwordHash: simpleHash(form.password),
          role: 'User'
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Registration failed.');
      } else {
        setSuccess('Registered successfully!');
        setForm({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bb1 to-bb2">
      <form
        className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col w-full max-w-md gap-5"
        onSubmit={handleSubmit}
      >
        <h2 className="text-bb1 text-3xl font-bold mb-2 text-center">Sign Up</h2>
        <input
          className="px-4 py-3 border-2 border-bb4 rounded-lg text-bb1 bg-bb5 focus:border-bb3 focus:bg-white outline-none transition"
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="px-4 py-3 border-2 border-bb4 rounded-lg text-bb1 bg-bb5 focus:border-bb3 focus:bg-white outline-none transition"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="px-4 py-3 border-2 border-bb4 rounded-lg text-bb1 bg-bb5 focus:border-bb3 focus:bg-white outline-none transition"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          className="px-4 py-3 border-2 border-bb4 rounded-lg text-bb1 bg-bb5 focus:border-bb3 focus:bg-white outline-none transition"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        {error && (
          <div className="bg-red-500 text-white rounded-md py-2 px-3 text-center text-base">{error}</div>
        )}
        {success && (
          <div className="bg-green-500 text-white rounded-md py-2 px-3 text-center text-base">{success}</div>
        )}
        <button
          className="bg-gradient-to-r from-bb2 to-bb3 text-white rounded-lg py-3 font-semibold text-lg mt-2 hover:from-bb3 hover:to-bb2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
