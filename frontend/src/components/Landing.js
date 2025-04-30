// ✅ src/components/Landing.js
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main>
      <div className="landing-hero">
        <h1 className="title">💼 Spendlytic</h1>
        <p className="subtitle">Smart and data-driven expense tracking to simplify your financial life.</p>

        <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '1rem auto' }}>
          <li>📊 AI-powered receipt analysis and parsing</li>
          <li>🧾 Automatically categorized expense tracking</li>
          <li>📈 Visual summaries and daily/monthly insights</li>
          <li>🔐 Secure, token-based access to your data</li>
        </ul>

        <div className="landing-btns">
          <Link to="/register">Get Started</Link>
          {/* <Link to="/login">Login</Link> */}
        </div>
      </div>
    </main>
  );
}
