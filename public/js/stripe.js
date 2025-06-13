// read data from HTML <meta> tags
const stripePublicKey = document.querySelector(
  'meta[name="stripe-public-key"]'
).content;
const sessionId = document.querySelector(
  'meta[name="stripe-session-id"]'
).content;

const stripe = Stripe(stripePublicKey);
const orderBtn = document.getElementById("order-btn");

orderBtn.addEventListener("click", function () {
  stripe.redirectToCheckout({ sessionId });
});
