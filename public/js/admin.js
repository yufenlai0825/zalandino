// run on the client, adding this to the products.ejs as a script at the end

document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll(".delete-btn"); 
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", ()=>{
        const prodID = btn.parentNode.querySelector("[name=productID]").value;
        const productElement = btn.closest("article"); // remove <article class="card product-item">
    fetch("/admin/product/" + prodID, {
      method: "DELETE"
    })
    .then(result => result.json())
    .then((data) => {
      console.log(data.message); // Successfully delete product
      productElement.parentNode.removeChild(productElement);
      // directly remove doesn't work so first access parentNode and then remove child
    })
    .catch((err) => {
      console.log(err);
    });
    });
  }); 
}); 
