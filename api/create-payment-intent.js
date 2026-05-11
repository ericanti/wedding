const Stripe = require('stripe');

module.exports = async (req, res) => {
  /* ── CORS (needed if site is on GitHub Pages, not Vercel) ── */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    });

    const { amount, description } = req.body;

    /* amount comes in as BRL (e.g. 180 = R$180).
       Stripe expects the smallest unit (centavos), so multiply × 100.
       Minimum is R$0.50 → 50 centavos.                                 */
    const amountCentavos = Math.max(50, Math.round(parseFloat(amount) * 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCentavos,
      currency: 'brl',
      description: description || 'Presente de casamento — Olivia & Eric',
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
