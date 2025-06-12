// run on the client, adding this to the products.ejs as a script at the end

const deleteProduct = (btn) => {
    // parentNode is the div, then look for the name
    // <input type="hidden" value="6835949b5c74cc6e87ea2977" name="productID">, use .value to get productID
    const prodID = btn.parentNode.querySelector("[name=productID]").value; 
    const productElement = btn.closest("article"); // remove <article class="card product-item">

    fetch("/admin/product/" + prodID, {
        method: "DELETE"
    })
    .then(result => {
        return result.json(); 
    })
    .then(data => {
        console.log(data.message); // Successfully delete product
        productElement.parentNode.removeChild(productElement); 
        // directly remove doesn't work so first access parentNode and then remove child 
    })
    .catch(err => {console.log(err)}); 

}; 


