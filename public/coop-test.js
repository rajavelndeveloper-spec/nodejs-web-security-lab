document.getElementById("open").addEventListener("click", () => {
  const popup = window.open(
    "https://www.example.com",
    "PopupWin",
    "width=600,height=400,left=200,top=100",
  );

  setTimeout(() => {
    console.log("Popup reference:", popup);
    console.log("Popup closed:", popup?.closed);
  }, 2000);
});
