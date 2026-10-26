document.getElementById("check-location").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    () => console.log("Location available"),
    (error) => console.log("Location error:", error.code, error.message),
  );
});
