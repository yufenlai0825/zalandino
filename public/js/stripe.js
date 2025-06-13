// originally send to frontend
// prevent inline script execution
// var stripe = Stripe("<%= stripePublicKey %>");
// var orderBtn = document.getElementById("order-btn");
// orderBtn.addEventListener("click", function(){
//     stripe.redirectToCheckout({
//         sessionId: "<%= sessionId %>"  // stripe only accepts sessionId as a valid param
//     });
// });

// Read data from HTML <meta> tags
const stripePublicKey = document.querySelector('meta[name="stripe-public-key"]').content;
const sessionId = document.querySelector('meta[name="stripe-session-id"]').content;

const stripe = Stripe(stripePublicKey); 
const orderBtn = document.getElementById("order-btn");

orderBtn.addEventListener("click", function () {
  stripe.redirectToCheckout({ sessionId });
});
