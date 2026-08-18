-- Evita reservas duplicadas para el mismo payment_intent de Stripe. Protege contra el caso
-- en que el navegador del cliente y el webhook de Stripe (/api/webhooks/stripe) intenten
-- confirmar la misma reserva casi a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_id_unique_idx
ON bookings (payment_id)
WHERE payment_id IS NOT NULL;
