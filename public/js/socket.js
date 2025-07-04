// to prevent inline script execution
const socket = io();
// determine the role is admin or user
const isAdmin = window.location.pathname.includes("/admin");
socket.emit("join", isAdmin ? "admin" : "user");

socket.on("products", (data) => {
  if (data.action === "add") {
    console.log("New product added:", data.product);
    if (!isAdmin) {
      location.reload();
    }
  } else if (data.action === "update") {
    console.log("Product is updated:", data.product);
    if (!isAdmin) {
      location.reload();
    }
  } else if (data.action === "delete") {
    console.log("Product is deleted:", data.product);
    if (!isAdmin) {
      location.reload();
    }
  }
});
