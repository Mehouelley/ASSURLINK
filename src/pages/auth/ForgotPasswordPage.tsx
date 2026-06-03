import { FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { backendApi } from '../../lib/backendApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await backendApi.auth.forgotPassword(email);
    setLoading(false);

    if (error) {
      setError('Impossible d’envoyer le lien de réinitialisation. Vérifiez votre email.');
      return;
    }

    setMessage('Si cet email existe dans notre système, un message de réinitialisation va vous être envoyé.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <button onClick={() => { window.location.href = '/login'; }} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-slate-500 mb-6">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@exemple.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
            {loading ? 'Envoi en cours...' : 'Recevoir le lien de réinitialisation'}
          </button>
        </form>
      </div>
    </div>
  );
}
