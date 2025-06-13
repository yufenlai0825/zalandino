// originally send to frontend
// prevent inline script execution
// var stripe = Stripe("<%= stripePublicKey %>");
// var orderBtn = document.getElementById("order-btn");
// orderBtn.addEventListener("click", function(){
//     stripe.redirectToCheckout({
//         sessionId: "<%= sessionId %>"  // stripe only accepts sessionId as a valid param
//     });
// });

const stripe = Stripe(window.stripePublicKey); // use window-scoped value
const orderBtn = document.getElementById("order-btn");
orderBtn.addEventListener("click", function () {
  stripe.redirectToCheckout({ sessionId: window.sessionId });
});
