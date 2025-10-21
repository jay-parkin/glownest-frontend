import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";

function InnerPayment({ buildOrderPayload, BASE, authHeaders }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // avoid double-creating orders on refresh/retry
  const [idemKey] = useState(
    () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
  );

  const pay = async () => {
    if (!stripe || !elements) return;
    setMessage("");
    setSubmitting(true);

    try {
      // collect checkout payload (items, addresses, totals)
      const payload = buildOrderPayload?.();
      if (!payload) {
        throw new Error("Please complete shipping details before paying.");
      }

      // grab payment intent from backend
      const intentRes = await fetch(`${BASE}/payments/create-intent`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({
          currency: payload.currency || "AUD",

          metadata: {
            itemCount: String(
              payload.items?.reduce((n, i) => n + (i.quantity || 0), 0) || 0
            ),
          },
          // Send full checkout details so server can compute exact amount
          checkout: payload,
        }),
      });

      const intentBody = await intentRes.json().catch(() => ({}));
      if (!intentRes.ok)
        throw new Error(intentBody.message || "Failed to start payment.");
      const { clientSecret, intentId } = intentBody || {};
      if (!clientSecret) throw new Error("Missing client secret from server.");

      // confirm card payment in the browser
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card element not ready.");
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card },
        }
      );

      if (error) throw new Error(error.message || "Card was declined.");
      if (!paymentIntent) throw new Error("Payment failed to complete.");
      if (paymentIntent.status !== "succeeded") {
        throw new Error(`Payment ${paymentIntent.status}`);
      }

      // payment succeeded — create the order as PAID
      const createOrderRes = await fetch(`${BASE}/orders`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey + "-order",
        },
        body: JSON.stringify({
          ...payload,
          status: "paid",
          paymentIntentId: intentId || paymentIntent.id,
          payment: {
            provider: "stripe",
            status: "succeeded",
            intentId: intentId || paymentIntent.id,
          },
          // Let server compute subtotal/shipping/tax/total from payload
        }),
      });

      const createdOrder = await createOrderRes.json().catch(() => ({}));
      if (!createOrderRes.ok) {
        // payment succeeded, but order creation failed
        throw new Error(
          createdOrder.message || "Payment captured, but order creation failed."
        );
      }

      // clean up cart and go to confirmation
      try {
        await clearCart();
      } catch { /* ignore */ }
      sessionStorage.setItem("justPlacedOrder", "1");
      navigate(`/order-confirmation/${createdOrder._id}`);
    } catch (e) {
      setMessage(e.message || "Something went wrong processing your payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-3">
      <h5 className="mb-2">Payment</h5>
      <p>This payment method is just a simulation. Don't provide real payment information.</p>
      <CardElement options={{ hidePostalCode: true }} />
      {message && <div className="alert alert-danger mt-3">{message}</div>}
      <button
        className="btn btn-success mt-3"
        onClick={pay}
        disabled={submitting || !stripe}
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
      <div className="text-muted small mt-2">
        Use Stripe test cards e.g. <code>4242 4242 4242 4242</code>, any future
        date, any CVC.
      </div>
    </div>
  );
}

export default function CheckoutPayment({
  buildOrderPayload,
  BASE,
  authHeaders,
}) {
  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk]);
  if (!pk)
    return <div className="alert alert-warning">Missing Stripe key.</div>;

  return (
    <Elements stripe={stripePromise} options={{}}>
      <InnerPayment
        buildOrderPayload={buildOrderPayload}
        BASE={BASE}
        authHeaders={authHeaders}
      />
    </Elements>
  );
}
